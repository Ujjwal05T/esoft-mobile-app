import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation/CatalogStack';
import { useCart, type CartItem } from '../context/CartContext';
import RedHeader from '../components/catalog/RedHeader';
import { PartRow, formatPrice } from '../components/catalog/CartParts';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import AppAlert from '../components/overlays/AppAlert';
import SearchIcon from '../assets/icons/search.svg';

type PaymentMethod = 'upi' | 'card' | 'cod';

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; short: string }[] =
  [
    { key: 'upi', label: 'UPI (GPay, PhonePe)', short: 'UPI' },
    { key: 'card', label: 'Credit / Debit Card', short: 'Card' },
    { key: 'cod', label: 'Cash on Delivery (COD)', short: 'COD' },
  ];

// Dummy values (to be replaced with the user's saved address / delivery API)
const DUMMY_ADDRESS = '23, Industrial Area, Phase 2, Chandigarh - 160002';
const DELIVERY_DAYS = 5;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

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

const StarBadgeIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Path
      d="M12 4V9M20 2V8M28 4V9"
      stroke="#ffffff"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <Path
      d="M20 14L23.1 20.3L30 21.3L25 26.2L26.2 33L20 29.8L13.8 33L15 26.2L10 21.3L16.9 20.3L20 14Z"
      fill="#ffffff"
    />
  </Svg>
);

function PartsCard({ title, items }: { title: string; items: CartItem[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {title} ({items.length})
      </Text>
      <View style={styles.titleDivider} />
      {items.map((item, i) => (
        <View key={item.product.id} style={i > 0 && styles.partSeparator}>
          <PartRow item={item} />
        </View>
      ))}
    </View>
  );
}

export default function PlaceOrderScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const tabBarHeight = useTabBarHeight();
  const { items: allItems, removeWhere } = useCart();
  const items = allItems.filter(i => !i.product.outOfStock);

  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [coupon, setCoupon] = useState('');
  const [info, setInfo] = useState<string | null>(null);

  const onOrderItems = items.filter(i => i.product.badge === 'On Order');
  const availableItems = items.filter(i => i.product.badge !== 'On Order');
  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );
  const total = subtotal;

  const handlePlaceOrder = () => {
    // Dummy order — replace with the create-order API when it exists
    const now = new Date();
    const yy = now.getFullYear() % 100;
    const delivery = new Date(
      now.getTime() + DELIVERY_DAYS * 24 * 60 * 60 * 1000,
    );
    const method = PAYMENT_OPTIONS.find(o => o.key === payment)!;
    const params = {
      orderId: `ET/ORD/${yy}-${yy + 1}/${String(
        Math.floor(10000 + Math.random() * 90000),
      )}`,
      estimatedDelivery: `${delivery.getDate()} ${
        MONTHS[delivery.getMonth()]
      } ${delivery.getFullYear()}`,
      amountPaid: `${formatPrice(total)} (${method.short})`,
    };
    removeWhere(i => !i.product.outOfStock);
    navigation.replace('Checkout', params);
  };

  return (
    <View style={styles.container}>
      <RedHeader
        title="Place Order"
        onBack={() => navigation.goBack()}
        right={<SearchIcon width={22} height={22} color="#ffffff" />}
      />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: tabBarHeight + 84 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <View style={styles.addressHeader}>
                <PinIcon />
                <Text style={styles.addressTitle}>Delivery Address</Text>
                <TouchableOpacity
                  onPress={() =>
                    setInfo('Changing the address is coming soon.')
                  }
                >
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.addressText}>{DUMMY_ADDRESS}</Text>
            </View>

            <PartsCard title="Available Parts" items={availableItems} />
            <PartsCard title="On Order Parts" items={onOrderItems} />

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Options</Text>
              {PAYMENT_OPTIONS.map(option => {
                const selected = payment === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={styles.radioRow}
                    activeOpacity={0.7}
                    onPress={() => setPayment(option.key)}
                  >
                    <View style={styles.radio}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.radioLabel,
                        selected && styles.radioLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.offerOuter}>
              <View style={styles.offerInner}>
                {/* Absolutely-positioned fill: on iOS, a gradient sized by its own
                    flex-row content can lock in at an unresolved (near-zero) width
                    on first layout. A fill behind statically-sized content always
                    has a definite size, so it stretches correctly on both platforms. */}
                <LinearGradient
                  colors={['#ffffff', '#f6d9d9', '#e5383b']}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.offerText}>
                  <Text style={styles.offerTitle}>
                    Special offer for pay online
                  </Text>
                  <Text style={styles.offerSub}>
                    Get up to 25% flat discount on online payment.
                  </Text>
                  <TouchableOpacity onPress={() => setPayment('upi')}>
                    <Text style={styles.offerLink}>Apply Discount</Text>
                  </TouchableOpacity>
                </View>
                <StarBadgeIcon />
              </View>
            </View>

            <View style={styles.couponRow}>
              <TextInput
                value={coupon}
                onChangeText={setCoupon}
                placeholder="Enter Coupon Code"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
                style={styles.couponInput}
              />
              <TouchableOpacity
                style={styles.couponBtn}
                activeOpacity={0.85}
                onPress={() => setInfo('Coupons are coming soon.')}
              >
                <Text style={styles.couponBtnText}>Apply Code</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping Fee</Text>
                <Text style={styles.freeText}>FREE</Text>
              </View>
              <View style={styles.titleDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(total)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { bottom: tabBarHeight }]}>
            <TouchableOpacity
              style={styles.placeOrderBtn}
              activeOpacity={0.85}
              onPress={handlePlaceOrder}
            >
              <Text style={styles.placeOrderText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <AppAlert
        isOpen={!!info}
        type="info"
        message={info ?? ''}
        onClose={() => setInfo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
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
  titleDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 6 },

  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#161a1d' },
  changeText: { fontSize: 13, fontWeight: '600', color: '#e5383b' },
  addressText: { fontSize: 12, color: '#4b5563', lineHeight: 18 },

  partSeparator: { borderTopWidth: 1, borderTopColor: '#f0f0f0' },

  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e5383b',
  },
  radioLabel: { fontSize: 13, color: '#161a1d' },
  radioLabelSelected: { fontWeight: '700' },

  offerOuter: {
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#ffffff',
  },
  offerInner: {
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  offerText: { flex: 1, gap: 4 },
  offerTitle: { fontSize: 17, fontWeight: '700', color: '#2b2b2b' },
  offerSub: { fontSize: 11, color: '#2b2b2b' },
  offerLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e5383b',
    textDecorationLine: 'underline',
    marginTop: 2,
  },

  couponRow: { flexDirection: 'row' },
  couponInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#161a1d',
  },
  couponBtn: {
    width: 107,
    height: 46,
    backgroundColor: '#e5383b',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponBtnText: { fontSize: 14, fontWeight: '500', color: '#ffffff' },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  summaryLabel: { fontSize: 13, color: '#161a1d' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: '#161a1d' },
  freeText: { fontSize: 13, fontWeight: '700', color: '#2e9e3f' },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#161a1d' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#e5383b' },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  placeOrderBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { fontSize: 16, color: '#6b7280' },
  emptyBtn: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 6,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
});
