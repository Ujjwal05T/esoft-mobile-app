import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import StatusBadge from '../components/ui/StatusBadge';
import {useAuth} from '../context/AuthContext';
import CouponOverlay from '../components/overlays/CouponOverlay';
import CodConfirmOverlay from '../components/overlays/CodConfirmOverlay';
import {
  getQuoteById,
  createPaymentOrder,
  verifyPayment,
  placeCodOrder,
  createPaymentLink,
  type QuoteApiResponse,
  type CouponValidationResponse,
} from '../services/api';
import RNShare, {Social as ShareSocial} from 'react-native-share';

// SVG payment icons from assets
import UpiIcon from '../assets/icons/upi.svg';
import PhonePeIcon from '../assets/icons/phonepe.svg';
import GPayIcon from '../assets/icons/gpay.svg';
import PaytmIcon from '../assets/icons/paytm.svg';
import BankIcon from '../assets/icons/Bank.svg';

import RazorpayCheckout, {type RazorpayOptions} from 'react-native-razorpay';
import creditCardImg from '../assets/icons/Credit-Card.png';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';
import {formatDateIST} from '../utils/dateUtils';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentNavProp = NativeStackNavigationProp<RootStackParamList, 'Payment'>;

const ArrowBackIcon = () => (
  <Svg width={23} height={18} viewBox="0 0 23 18" fill="none">
    <Path
      d="M9 17L1 9M1 9L9 1M1 9H22"
      stroke="#000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WhatsAppIcon = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      fill="#25D366"
    />
  </Svg>
);

export default function PaymentScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<PaymentNavProp>();
  const route = useRoute<PaymentRouteProp>();
  const {quoteId, selectedItemIds} = route.params;
  const {user} = useAuth();

  const [quote, setQuote] = useState<QuoteApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [codLoading, setCodLoading] = useState(false);
  const [codSheetOpen, setCodSheetOpen] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  // Coupon state
  const [couponOverlayOpen, setCouponOverlayOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);

  useEffect(() => {
    async function fetchQuote() {
      try {
        setLoading(true);
        const result = await getQuoteById(quoteId);
        if (result.success && result.data) {
          setQuote(result.data);
        }
      } catch (e) {
        console.error('Failed to fetch quote:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [quoteId]);

  const formatPrice = (amount: number) =>
    `Rs. ${amount.toLocaleString('en-IN')}`;

  const additionalCharges = quote
    ? (quote.packingCharges || 0) +
      (quote.forwardingCharges || 0) +
      (quote.shippingCharges || 0)
    : 0;

  // If partial payment, calculate subtotal only for selected items
  const partsSubtotal = quote
    ? selectedItemIds.length > 0
      ? quote.items
          .filter(i => selectedItemIds.includes(i.id))
          .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
      : quote.totalAmount - additionalCharges
    : 0;

  const grandTotal = partsSubtotal + additionalCharges;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const payableTotal = grandTotal - discountAmount;

  const getExpiresLabel = () => {
    if (!quote?.expiresAt) return null;
    const diffMs = new Date(quote.expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (diffHours <= 24) return `${diffHours} hours`;
    return `${Math.ceil(diffMs / (1000 * 60 * 60 * 24))} days`;
  };

  const handlePay = useCallback(
    async (method: string) => {
      if (!quote || paymentLoading) return;

      if (!RazorpayCheckout) {
        console.error('[Payment] RazorpayCheckout module not found');
        setAppAlert({type: 'warning', title: t('payment.unavailable'), message: t('payment.gateway_not_configured')});
        return;
      }

      try {
        setPaymentLoading(true);
        setSelectedMethod(method);

        console.log('[Payment] Creating order for quote:', quote.id, 'method:', method);
        const orderResult = await createPaymentOrder(
          quote.id,
          selectedItemIds.length > 0 ? selectedItemIds : undefined,
          appliedCoupon?.code,
        );
        console.log('[Payment] Order result:', JSON.stringify(orderResult));

        if (!orderResult.success || !orderResult.data) {
          console.error('[Payment] Order creation failed:', orderResult);
          setAppAlert({type: 'error', message: t('payment.order_failed')});
          setPaymentLoading(false);
          return;
        }

        const {orderId, amount, currency, keyId} = orderResult.data;
        console.log('[Payment] Order created:', {orderId, amount, currency, keyId});

        const options: RazorpayOptions = {
          description: `Payment for ${quote.quoteNumber}`,
          currency,
          key: keyId,
          amount,
          name: 'Parts Now',
          order_id: orderId,
          prefill: {
            name: quote.workshopName || '',
          },
          theme: {color: '#e5383b'},
          method,
        };

        console.log('[Payment] Opening Razorpay with options:', JSON.stringify(options));
        const data = await RazorpayCheckout.open(options);
        console.log('[Payment] Razorpay success response:', JSON.stringify(data));

        console.log('[Payment] Verifying payment...');
        const verifyResult = await verifyPayment({
          quoteId: quote.id,
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
          selectedItemIds: selectedItemIds.length > 0 ? selectedItemIds : undefined,
          couponCode: appliedCoupon?.code,
          discountAmount: appliedCoupon?.discountAmount,
        });
        console.log('[Payment] Verify result:', JSON.stringify(verifyResult));

        if (verifyResult.success) {
          setAppAlert({type: 'success', message: t('payment.success'), onDone: () => navigation.navigate('QuoteDetail', {quoteId: quote.id})});
        } else {
          console.error('[Payment] Verification failed:', verifyResult);
          setAppAlert({type: 'error', message: t('payment.verify_failed')});
        }
      } catch (error: unknown) {
        // Razorpay errors are objects with code + description — JSON.stringify gives {}
        // so log each field manually
        const rzpError = error as {code?: number; description?: string; source?: string; step?: string; reason?: string};
        console.error('[Payment] Caught error — code:', rzpError?.code);
        console.error('[Payment] Caught error — description:', rzpError?.description);
        console.error('[Payment] Caught error — source:', rzpError?.source);
        console.error('[Payment] Caught error — step:', rzpError?.step);
        console.error('[Payment] Caught error — reason:', rzpError?.reason);
        console.error('[Payment] Raw error (toString):', String(error));

        // code 0 = user dismissed the modal, not a real error
        if (rzpError?.code !== 0) {
          setAppAlert({type: 'error', title: t('payment.failed'), message: `${rzpError?.description || 'Payment was not completed.'} (code: ${rzpError?.code})`});
        } else {
          console.log('[Payment] User dismissed the payment modal');
        }
      } finally {
        setPaymentLoading(false);
        setSelectedMethod(null);
      }
    },
    [quote, paymentLoading, navigation, appliedCoupon],
  );

  const handleCod = useCallback(async (idempotencyKey: string) => {
    if (!quote || codLoading || paymentLoading) return;
    try {
      setCodLoading(true);
      const result = await placeCodOrder({
        quoteId: quote.id,
        selectedItemIds: selectedItemIds.length > 0 ? selectedItemIds : undefined,
        couponCode: appliedCoupon?.code,
        discountAmount: appliedCoupon?.discountAmount,
        idempotencyKey,
      });
      if (result.success) {
        setAppAlert({
          type: 'success',
          message: t('payment.cod_success'),
          onDone: () => navigation.navigate('QuoteDetail', {quoteId: quote.id}),
        });
      } else {
        setAppAlert({type: 'error', message: t('payment.cod_failed')});
      }
    } catch {
      setAppAlert({type: 'error', message: t('payment.cod_failed')});
    } finally {
      setCodLoading(false);
    }
  }, [quote, codLoading, paymentLoading, selectedItemIds, appliedCoupon, navigation, t]);

  const handleShareLink = useCallback(async () => {
    if (!quote || paymentLoading || codLoading || linkLoading) return;
    try {
      setLinkLoading(true);

      const linkResult = await createPaymentLink({
        quoteId: quote.id,
        selectedItemIds: selectedItemIds.length > 0 ? selectedItemIds : undefined,
        couponCode: appliedCoupon?.code,
      });

      if (!linkResult.success || !linkResult.data) {
        setAppAlert({type: 'error', message: t('payment.share_link_failed')});
        return;
      }

      const message = t('payment.share_link_message', {
        quoteNumber: quote.quoteNumber,
        amount: formatPrice(payableTotal),
        link: linkResult.data.shortUrl,
      });

      try {
        // Try to open WhatsApp directly with the message pre-filled
        await RNShare.shareSingle({
          social: ShareSocial.Whatsapp,
          message,
        });
      } catch (shareError) {
        console.warn('[Payment] Direct WhatsApp share failed, falling back to share sheet:', shareError);
        try {
          // WhatsApp not installed / unavailable — fall back to the OS share sheet
          await RNShare.open({message, failOnCancel: false});
        } catch {
          // user cancelled the fallback sheet — nothing to do
        }
      }
    } catch (error) {
      console.error('[Payment] Failed to create payment link:', error);
      setAppAlert({type: 'error', message: t('payment.share_link_failed')});
    } finally {
      setLinkLoading(false);
    }
  }, [quote, paymentLoading, codLoading, linkLoading, selectedItemIds, appliedCoupon, payableTotal, t]);

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#e5383b" />
        <Text style={styles.loadingText}>{t('payment.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.notFoundText}>{t('orders.quote_not_found')}</Text>
      </SafeAreaView>
    );
  }

  const expiresLabel = getExpiresLabel();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={styles.backBtn}>
          <ArrowBackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('payment.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ════════════════════════════════════════
            QUOTE SUMMARY CARD
            ════════════════════════════════════════ */}
        <View style={styles.summaryCard}>
          {/* Top row: vehicle info + status */}
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryLeft}>
              {quote.vehicleName && (
                <>
                  <Text style={styles.vehicleName}>{quote.vehicleName}</Text>
                  {quote.plateNumber && (
                    <Text style={styles.plateNumber}>{quote.plateNumber}</Text>
                  )}
                </>
              )}
              <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
              <Text style={styles.dateText}>
                {t('quote.submitted')} {formatDateIST(quote.createdAt)}
              </Text>
            </View>
            <View style={styles.summaryRight}>
              <StatusBadge
                status={
                  quote.status === 'approved'
                    ? 'approved'
                    : quote.status === 'rejected'
                    ? 'declined'
                    : 'pending_review'
                }
              />
              {expiresLabel && expiresLabel !== 'Expired' && (
                <Text style={styles.expiresText}>
                  {t('quote.expires_in')}{' '}
                  <Text style={styles.expiresValue}>{expiresLabel}</Text>
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Delivery + Parts Subtotal */}
          <View style={styles.financialRow}>
            <View>
              <Text style={styles.financialLabel}>{t('orders.delivery_by')}</Text>
              <Text style={styles.financialValue}>
                {quote.expiresAt ? formatDateIST(quote.expiresAt) : '-'}
              </Text>
            </View>
            <View>
              <Text style={styles.financialLabel}>{t('orders.parts_subtotal')}</Text>
              <Text style={styles.financialValue}>
                {formatPrice(partsSubtotal)}
              </Text>
            </View>
          </View>

          {/* Additional Charges + Grand Total */}
          <View style={styles.financialRow}>
            <View style={styles.flex1}>
              <Text style={styles.financialLabel}>
                {t('payment.additional_charges')}
              </Text>
              <Text style={styles.financialValue}>
                {formatPrice(additionalCharges)}
              </Text>
            </View>
            <View style={styles.grandTotalCol}>
              <Text style={styles.financialLabel}>{t('orders.grand_total')}</Text>
              <Text style={styles.financialValue}>
                {formatPrice(grandTotal)}
              </Text>
            </View>
          </View>

          {/* Coupon discount row */}
          {appliedCoupon ? (
            <View style={styles.couponAppliedRow}>
              <View style={styles.couponAppliedLeft}>
                <Text style={styles.couponAppliedCode}>{appliedCoupon.code}</Text>
                <Text style={styles.couponAppliedSaving}>
                  {t('payment.coupon_saving', {amount: formatPrice(appliedCoupon.discountAmount)})}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAppliedCoupon(null)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text style={styles.couponRemove}>{t('payment.coupon_remove')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setCouponOverlayOpen(true)}>
              <Text style={styles.couponLink}>{t('payment.have_promo_code')}</Text>
            </TouchableOpacity>
          )}

          {/* Payable total (only shown when discount applied) */}
          {appliedCoupon && (
            <View style={styles.payableTotalRow}>
              <Text style={styles.payableTotalLabel}>{t('payment.payable_total')}</Text>
              <Text style={styles.payableTotalValue}>{formatPrice(payableTotal)}</Text>
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════
            SELECT PAYMENT METHOD
            ════════════════════════════════════════ */}
        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>{t('orders.select_payment')}</Text>

          <View style={styles.methodList}>
            {/* ── Credit / Debit Card ── */}
            <TouchableOpacity
              onPress={() => handlePay('card')}
              disabled={paymentLoading}
              activeOpacity={0.8}
              style={[
                styles.methodItem,
                selectedMethod === 'card' && styles.methodItemSelected,
                paymentLoading && styles.methodItemDisabled,
              ]}>
              <View style={styles.methodIconBox}>
                <Image
                  source={creditCardImg}
                  style={styles.creditCardImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.methodLabel}>{t('orders.credit_debit')}</Text>
            </TouchableOpacity>

            {/* ── Net Banking ── */}
            <TouchableOpacity
              onPress={() => handlePay('netbanking')}
              disabled={paymentLoading}
              activeOpacity={0.8}
              style={[
                styles.methodItem,
                selectedMethod === 'netbanking' && styles.methodItemSelected,
                paymentLoading && styles.methodItemDisabled,
              ]}>
              <View style={styles.methodIconBox}>
                <BankIcon width={36} height={34} />
              </View>
              <Text style={styles.methodLabel}>{t('orders.net_banking')}</Text>
            </TouchableOpacity>

            {/* ── UPI ── */}
            <TouchableOpacity
              onPress={() => handlePay('upi')}
              disabled={paymentLoading}
              activeOpacity={0.8}
              style={[
                styles.methodItem,
                styles.methodItemUpi,
                selectedMethod === 'upi' && styles.methodItemSelected,
                paymentLoading && styles.methodItemDisabled,
              ]}>
              {/* UPI logo */}
              <View style={styles.upiLogoBox}>
                <UpiIcon width={66} height={34} />
              </View>

              {/* Stacked payment app icons */}
              <View style={styles.upiAppsRow}>
                <View style={[styles.upiAppCircle, {zIndex: 3}]}>
                  <PhonePeIcon width={28} height={28} />
                </View>
                <View style={[styles.upiAppCircle, styles.upiAppOverlap, {zIndex: 2}]}>
                  <GPayIcon width={28} height={28} />
                </View>
                <View
                  style={[
                    styles.upiAppCircle,
                    styles.upiAppOverlap,
                    styles.upiAppSmall,
                    {zIndex: 1},
                  ]}>
                  <PaytmIcon width={24} height={24} />
                </View>
              </View>
            </TouchableOpacity>

            {/* ── Cash on Delivery ── */}
            {quote.isCodEligible && (
              <TouchableOpacity
                onPress={() => setCodSheetOpen(true)}
                disabled={paymentLoading || codLoading}
                activeOpacity={0.8}
                style={[
                  styles.methodItem,
                  codLoading && styles.methodItemSelected,
                  (paymentLoading || codLoading) && styles.methodItemDisabled,
                ]}>
                <View style={styles.methodIconBox}>
                  <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Z"
                      stroke="#737373"
                      strokeWidth={1.6}
                    />
                    <Path
                      d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
                      stroke="#737373"
                      strokeWidth={1.6}
                    />
                    <Path
                      d="M6 12h.01M18 12h.01"
                      stroke="#737373"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                {codLoading ? (
                  <ActivityIndicator size="small" color="#e5383b" style={{flex: 1}} />
                ) : (
                  <Text style={styles.methodLabel}>{t('payment.cod')}</Text>
                )}
              </TouchableOpacity>
            )}

            {/* ── Share Payment Link (WhatsApp) ── */}
            <TouchableOpacity
              onPress={handleShareLink}
              disabled={paymentLoading || codLoading || linkLoading}
              activeOpacity={0.8}
              style={[
                styles.methodItem,
                linkLoading && styles.methodItemSelected,
                (paymentLoading || codLoading || linkLoading) && styles.methodItemDisabled,
              ]}>
              <View style={styles.methodIconBox}>
                <WhatsAppIcon />
              </View>
              {linkLoading ? (
                <ActivityIndicator size="small" color="#e5383b" style={{flex: 1}} />
              ) : (
                <Text style={styles.methodLabel}>{t('payment.share_link')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Processing indicator */}
        {paymentLoading && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="small" color="#e5383b" />
            <Text style={styles.processingText}>
              {t('payment.opening_gateway')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── COD Confirm Sheet ──────────────────── */}
      <CodConfirmOverlay
        isOpen={codSheetOpen}
        onClose={() => setCodSheetOpen(false)}
        onConfirm={(key) => {
          setCodSheetOpen(false);
          handleCod(key);
        }}
        payableAmount={payableTotal}
        loading={codLoading}
      />

      {/* ── Coupon Overlay ─────────────────────── */}
      <CouponOverlay
        isOpen={couponOverlayOpen}
        onClose={() => setCouponOverlayOpen(false)}
        orderAmount={grandTotal}
        workshopOwnerId={user?.id ?? 0}
        onCouponApplied={coupon => setAppliedCoupon(coupon)}
      />

      <AppAlert
        isOpen={!!appAlert}
        type={appAlert?.type ?? 'info'}
        title={appAlert?.title}
        message={appAlert?.message ?? ''}
        onClose={() => {
          const done = appAlert?.onDone;
          setAppAlert(null);
          done?.();
        }}
        onConfirm={appAlert?.onConfirm ? () => {
          const confirm = appAlert.onConfirm!;
          setAppAlert(null);
          confirm();
        } : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#f5f5f5'},
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  loadingText: {marginTop: 12, fontSize: 14, color: '#666'},
  notFoundText: {fontSize: 14, color: '#666'},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {padding: 4},
  headerTitle: {fontSize: 24, fontWeight: '600', color: '#e5383b'},
  headerRight: {width: 31},

  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 16},

  // Summary card
  summaryCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 10,
    padding: 16,
    gap: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLeft: {flex: 1, gap: 2},
  vehicleName: {fontSize: 14, fontWeight: '600', color: '#4c4c4c'},
  plateNumber: {fontSize: 17, fontWeight: '700', color: '#e5383b'},
  quoteNumber: {fontSize: 14, fontWeight: '700', color: '#e8353b', marginTop: 6},
  dateText: {fontSize: 12, fontWeight: '500', color: '#828282'},
  summaryRight: {alignItems: 'flex-end', gap: 5, flexShrink: 0},
  expiresText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    letterSpacing: -0.41,
  },
  expiresValue: {fontWeight: '700', color: '#e5383b'},
  divider: {height: 1, backgroundColor: '#dadada'},
  financialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  financialLabel: {fontSize: 11, fontWeight: '500', color: '#000'},
  financialValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5383b',
    marginTop: 4,
  },
  flex1: {flex: 1},
  grandTotalCol: {minWidth: 75},

  // Payment method card
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    gap: 16,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.01,
  },
  methodList: {gap: 8},
  methodItem: {
    backgroundColor: '#f3f3f3',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 20,
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodItemSelected: {
    backgroundColor: '#ffe8e8',
    borderColor: '#e5383b',
  },
  methodItemDisabled: {opacity: 0.6},
  methodItemUpi: {justifyContent: 'space-between'},
  methodIconBox: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  creditCardImg: {width: 36, height: 34},
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
    letterSpacing: -0.01,
  },

  // UPI row
  upiLogoBox: {alignItems: 'center', justifyContent: 'center'},
  upiAppsRow: {flexDirection: 'row', alignItems: 'center'},
  upiAppCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f3f3f3',
  },
  upiAppOverlap: {marginLeft: -7},
  upiAppSmall: {width: 36, height: 36, borderRadius: 18},

  // Processing indicator
  processingCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },

  // Coupon — inline summary card elements
  couponLink: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e5383b',
    textDecorationLine: 'underline',
    textAlign: 'right',
  },
  couponAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  couponAppliedLeft: {gap: 2},
  couponAppliedCode: {fontSize: 13, fontWeight: '700', color: '#16a34a'},
  couponAppliedSaving: {fontSize: 12, fontWeight: '500', color: '#15803d'},
  couponRemove: {fontSize: 12, fontWeight: '600', color: '#e5383b'},
  payableTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  payableTotalLabel: {fontSize: 13, fontWeight: '700', color: '#000'},
  payableTotalValue: {fontSize: 18, fontWeight: '800', color: '#e5383b'},

});
