import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RazorpayCheckout, { type RazorpayOptions } from 'react-native-razorpay';
import type { CatalogStackParamList } from '../navigation/CatalogStack';
import { useCart } from '../context/CartContext';
import RedHeader from '../components/catalog/RedHeader';
import ImagePlaceholder from '../components/catalog/ImagePlaceholder';
import { formatPrice } from '../components/catalog/CartParts';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import AppAlert from '../components/overlays/AppAlert';
import { isAvailable } from '../components/overlays/CouponOverlay';
import {
  AppliedCouponBanner,
  CouponStrip,
} from '../components/payment/CouponParts';
import { showToast } from '../components/ui/Toast';
import SearchIcon from '../assets/icons/search.svg';
import {
  getAddresses,
  getAvailableCoupons,
  startCheckout,
  validateCheckout,
  verifyCheckout,
  type CheckoutSummary,
  type Coupon,
  type WorkshopAddress,
} from '../services/api';
import { formatAddress } from './AddressesScreen';

const PinIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21C12 21 19 14.5 19 9.5C19 5.64 15.86 2.5 12 2.5C8.14 2.5 5 5.64 5 9.5C5 14.5 12 21 12 21Z"
      stroke="#e5383b"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={9.5} r={2.5} stroke="#e5383b" strokeWidth={2} />
  </Svg>
);

// Pay for the in-stock parts in the shared cart, online. Stock is checked when this screen opens,
// again right before the payment starts, and a last time after it succeeds (a refund follows if the
// last unit was taken meanwhile).
export default function PlaceOrderScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const tabBarHeight = useTabBarHeight();
  const { vehicle, refresh: refreshCart } = useCart();
  const route = useRoute();
  const pickedId = (route.params as { addressId?: number } | undefined)
    ?.addressId;

  const [address, setAddress] = useState<WorkshopAddress | null>(null);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  // Coupons: the available ones (null until loaded), the applied code, and the chip being applied
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  // The best coupon is applied by itself once; if the customer removes it, it stays off
  const autoTried = useRef(false);
  const userRemoved = useRef(false);
  const [alert, setAlert] = useState<{
    message: string;
    type: 'info' | 'error' | 'warning';
  } | null>(null);

  // Opens with fresh stock, prices and the chosen (or default) address
  const load = useCallback(async () => {
    const res = await getAddresses();
    const list = res.success && res.data ? res.data : [];
    const chosen =
      list.find(a => a.id === pickedId) ??
      list.find(a => a.isDefault) ??
      list[0] ??
      null;
    setAddress(chosen);

    if (chosen) {
      const check = await validateCheckout({
        addressId: chosen.id,
        vehicleId: vehicle?.id,
        couponCode: coupon ?? undefined,
      });
      const rejected = check.data?.issues.find(
        i => i.code === 'coupon_invalid',
      );
      if (check.success && check.data && coupon && rejected) {
        // The applied coupon stopped being valid (for example the cart changed): drop it
        showToast({ type: 'error', message: rejected.message });
        setCoupon(null);
        return;
      }
      if (check.success && check.data) setSummary(check.data);
      else
        setAlert({
          type: 'error',
          message: check.error ?? 'Could not check your cart.',
        });
    } else {
      setSummary(null);
    }
    setLoading(false);
  }, [pickedId, vehicle?.id, coupon]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Available coupons for catalog orders
  useEffect(() => {
    let cancelled = false;
    getAvailableCoupons().then(res => {
      if (cancelled) return;
      setCoupons(
        res.success && res.data
          ? res.data.filter(c => isAvailable(c, 'catalog'))
          : [],
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Applies the best coupon the order already qualifies for (highest saving first); the server has the last word
  useEffect(() => {
    if (
      autoTried.current ||
      userRemoved.current ||
      coupon ||
      coupons === null ||
      !address ||
      !summary ||
      !summary.canPay ||
      summary.lines.length === 0
    ) {
      return;
    }
    autoTried.current = true;
    const subtotal = summary.subtotal;
    const candidates = coupons
      .filter(c => c.minOrderValue == null || subtotal >= c.minOrderValue)
      .map(c => ({
        c,
        saving:
          c.discountType === 'percentage'
            ? Math.min(
                (c.discountValue / 100) * subtotal,
                c.maxDiscountAmount ?? Number.MAX_SAFE_INTEGER,
              )
            : c.discountValue,
      }))
      .sort((a, b) => b.saving - a.saving)
      .slice(0, 5);

    (async () => {
      for (const { c } of candidates) {
        const check = await validateCheckout({
          addressId: address.id,
          vehicleId: vehicle?.id,
          couponCode: c.code,
        });
        if (check.success && check.data?.couponCode === c.code) {
          setCoupon(c.code);
          setSummary(check.data);
          showToast({
            type: 'success',
            title: 'Coupon applied!',
            message: `${c.code} applied. You saved ${formatPrice(
              check.data.discountAmount,
            )}`,
            actionLabel: 'Remove',
            onActionPress: removeCoupon,
          });
          return;
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupons, summary, address, coupon]);

  const removeCoupon = () => {
    userRemoved.current = true;
    setCoupon(null);
  };

  // Tapping a coupon chip: check it with the server and apply it only if it is accepted
  const applyChip = async (c: Coupon) => {
    if (applyingCode || !address) return;
    setApplyingCode(c.code);
    try {
      const check = await validateCheckout({
        addressId: address.id,
        vehicleId: vehicle?.id,
        couponCode: c.code,
      });
      if (check.success && check.data?.couponCode === c.code) {
        userRemoved.current = false;
        setCoupon(c.code);
        setSummary(check.data);
        showToast({
          type: 'success',
          title: 'Coupon applied!',
          message: `${c.code} applied. You saved ${formatPrice(
            check.data.discountAmount,
          )}`,
          actionLabel: 'Remove',
          onActionPress: removeCoupon,
        });
      } else {
        const why = check.data?.issues.find(i => i.code === 'coupon_invalid');
        showToast({
          type: 'error',
          message: why?.message ?? check.error ?? 'This coupon cannot be used.',
        });
      }
    } finally {
      setApplyingCode(null);
    }
  };

  const pay = async () => {
    if (!address || paying) return;
    setPaying(true);
    try {
      // Stock is checked again on the server before the payment is created
      const started = await startCheckout({
        addressId: address.id,
        vehicleId: vehicle?.id,
        couponCode: coupon ?? undefined,
      });
      if (!started.success || !started.data) {
        await load();
        await refreshCart();
        setAlert({
          type: 'warning',
          message:
            started.error ??
            'Something changed in your cart. Please check it and try again.',
        });
        return;
      }

      const s = started.data;
      const options: RazorpayOptions = {
        description: 'Parts Now order',
        currency: s.currency,
        key: s.keyId,
        amount: s.amount,
        name: 'Parts Now',
        order_id: s.razorpayOrderId,
        theme: { color: '#e5383b' },
      };

      let paid: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };
      try {
        paid = await RazorpayCheckout.open(options);
      } catch {
        setAlert({
          type: 'info',
          message:
            'The payment was cancelled or did not go through. You have not been charged.',
        });
        return;
      }

      const outcome = await verifyCheckout({
        razorpayOrderId: paid.razorpay_order_id,
        razorpayPaymentId: paid.razorpay_payment_id,
        razorpaySignature: paid.razorpay_signature,
      });
      await refreshCart();

      if (!outcome.success || !outcome.data) {
        setAlert({
          type: 'warning',
          message:
            outcome.error ??
            'We could not confirm your payment yet. If money was deducted, your order will appear in My Orders shortly.',
        });
        return;
      }

      if (outcome.data.status === 'confirmed' && outcome.data.orderId) {
        navigation.replace('Checkout', { orderId: outcome.data.orderId });
        return;
      }

      // Stock ran out after payment: the payment is refunded
      await load();
      setAlert({ type: 'warning', message: outcome.data.message });
    } finally {
      setPaying(false);
    }
  };

  const blocking = summary?.issues.filter(i => i.blocking) ?? [];
  const notes = summary?.issues.filter(i => !i.blocking) ?? [];
  const canPay = !!summary && summary.canPay && !paying;

  return (
    <View style={styles.container}>
      <RedHeader
        title="Place Order"
        onBack={() => navigation.goBack()}
        right={<SearchIcon width={22} height={22} color="#ffffff" />}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#e5383b" />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: tabBarHeight + 96 },
            ]}
          >
            <View style={styles.card}>
              <View style={styles.addressHeader}>
                <PinIcon />
                <Text style={styles.addressTitle}>Delivery Address</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Addresses', {
                      select: true,
                      selectedId: address?.id,
                    })
                  }
                >
                  <Text style={styles.changeText}>
                    {address ? 'Change' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.addressText}>
                {address
                  ? `${address.contactName}, ${address.phone}\n${formatAddress(
                      address,
                    )}`
                  : 'No delivery address yet. Tap Add to create one.'}
              </Text>
            </View>

            {blocking.length > 0 && (
              <View style={[styles.notice, styles.noticeBlock]}>
                {blocking.map((i, n) => (
                  <Text key={n} style={styles.noticeBlockText}>
                    • {i.message}
                  </Text>
                ))}
              </View>
            )}
            {notes.length > 0 && (
              <View style={[styles.notice, styles.noticeInfo]}>
                {notes.map((i, n) => (
                  <Text key={n} style={styles.noticeInfoText}>
                    • {i.message}
                  </Text>
                ))}
              </View>
            )}

            {summary && summary.lines.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Parts ({summary.lines.length})
                </Text>
                {summary.lines.map((l, i) => (
                  <View
                    key={l.variantId}
                    style={[styles.line, i > 0 && styles.lineSeparator]}
                  >
                    <View style={styles.lineImage}>
                      {l.imageUrl ? (
                        <Image
                          source={{ uri: l.imageUrl }}
                          style={styles.lineImg}
                          resizeMode="contain"
                        />
                      ) : (
                        <ImagePlaceholder size={30} label={null} />
                      )}
                    </View>
                    <View style={styles.lineInfo}>
                      <Text style={styles.lineName}>{l.name}</Text>
                      <Text style={styles.lineMeta}>
                        {l.brandName} · {l.sku}
                      </Text>
                      <Text style={styles.lineMeta}>
                        {formatPrice(l.price)} × {l.quantity}
                      </Text>
                      {l.isLowStock && (
                        <Text style={styles.lineLow}>
                          Only {l.stock} left in stock
                        </Text>
                      )}
                    </View>
                    <Text style={styles.lineTotal}>
                      {formatPrice(l.lineTotal)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {summary && summary.lines.length > 0 && (
              <CouponStrip
                coupons={coupons ?? []}
                appliedCode={summary.couponCode}
                applyingCode={applyingCode}
                onApply={applyChip}
              />
            )}

            {summary && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Order Summary</Text>
                {summary.couponCode && (
                  <View style={styles.bannerWrap}>
                    <AppliedCouponBanner
                      coupon={{
                        isValid: true,
                        code: summary.couponCode,
                        discountAmount: summary.discountAmount,
                        originalAmount: summary.subtotal,
                        finalAmount: summary.subtotal - summary.discountAmount,
                      }}
                      formatAmount={formatPrice}
                      onRemove={removeCoupon}
                    />
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(summary.subtotal)}
                  </Text>
                </View>
                {summary.discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Coupon ({summary.couponCode})
                    </Text>
                    <Text style={styles.discountValue}>
                      − {formatPrice(summary.discountAmount)}
                    </Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    GST ({summary.gstRate}%)
                  </Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(summary.gstAmount)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryValue}>
                    {summary.shippingCharges > 0
                      ? formatPrice(summary.shippingCharges)
                      : 'Free'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {formatPrice(summary.total)}
                  </Text>
                </View>
                <Text style={styles.payNote}>
                  GST is added on the amount after the coupon. Pay online with
                  UPI, card or net banking.
                </Text>
              </View>
            )}

            {!summary && !address && (
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.outlineBtnText}>Back to Cart</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={[styles.footer, { bottom: tabBarHeight }]}>
            <TouchableOpacity
              style={[styles.payBtn, !canPay && styles.payBtnDisabled]}
              activeOpacity={0.85}
              disabled={!canPay}
              onPress={pay}
            >
              {paying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.payText}>
                  {summary ? `Pay ${formatPrice(summary.total)}` : 'Pay'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <AppAlert
        isOpen={!!alert}
        type={alert?.type ?? 'info'}
        message={alert?.message ?? ''}
        onClose={() => setAlert(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161a1d',
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 6 },

  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#161a1d' },
  changeText: { fontSize: 13, fontWeight: '600', color: '#e5383b' },
  addressText: { fontSize: 12, color: '#4b5563', lineHeight: 18 },

  notice: { borderRadius: 8, padding: 12, gap: 4 },
  noticeBlock: {
    backgroundColor: '#fce8e6',
    borderWidth: 1,
    borderColor: '#f3c9c5',
  },
  noticeBlockText: { fontSize: 13, color: '#b91c1c' },
  noticeInfo: {
    backgroundColor: '#fff7e6',
    borderWidth: 1,
    borderColor: '#fde3a7',
  },
  noticeInfoText: { fontSize: 13, color: '#92400e' },

  line: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  lineSeparator: { borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  lineImage: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineImg: { width: '88%', height: '88%' },
  lineInfo: { flex: 1, gap: 2 },
  lineName: { fontSize: 13, fontWeight: '600', color: '#161a1d' },
  lineMeta: { fontSize: 12, color: '#6b7280' },
  lineLow: { fontSize: 12, color: '#b45309', marginTop: 2 },
  lineTotal: { fontSize: 13, fontWeight: '700', color: '#161a1d' },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: { fontSize: 13, color: '#4b5563' },
  summaryValue: { fontSize: 13, color: '#161a1d' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#161a1d' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#161a1d' },
  bannerWrap: { marginBottom: 8 },
  discountValue: { fontSize: 13, color: '#15803d' },
  payNote: { fontSize: 11, color: '#6b7280', marginTop: 8 },

  outlineBtn: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { fontSize: 15, color: '#e5383b' },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  payBtn: {
    height: 48,
    borderRadius: 4,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnDisabled: { backgroundColor: '#f1a5a7' },
  payText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
