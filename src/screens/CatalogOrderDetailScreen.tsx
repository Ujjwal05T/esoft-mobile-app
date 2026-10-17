import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/RootNavigator';
import RedHeader from '../components/catalog/RedHeader';
import ImagePlaceholder from '../components/catalog/ImagePlaceholder';
import StatusBadge, { type StatusType } from '../components/ui/StatusBadge';
import { formatPrice } from '../components/catalog/CartParts';
import { getCatalogOrder, type CatalogOrder } from '../services/api';
import { formatDateIST } from '../utils/dateUtils';
import { formatAddress } from './AddressesScreen';

type Route = NativeStackScreenProps<
  RootStackParamList,
  'CatalogOrderDetail'
>['route'];

function badgeStatus(status: string): StatusType {
  if (status === 'shipped') return 'shipped';
  if (status === 'delivered') return 'delivered';
  return 'in_process';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// An order placed from the parts catalog: items, delivery, shipping details and the amount breakdown.
export default function CatalogOrderDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<CatalogOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await getCatalogOrder(params.orderId);
    if (res.success && res.data) setOrder(res.data);
    else setError(res.error ?? 'Could not load this order.');
  }, [params.orderId]);

  // Reload when the screen is shown again, so a status or date change made by the team appears
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <RedHeader title="Order Details" onBack={() => navigation.goBack()} />

      {!order && !error && (
        <View style={styles.center}>
          <ActivityIndicator color="#e5383b" />
        </View>
      )}

      {error && !order && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {order && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.card}>
            <View style={styles.headRow}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <StatusBadge status={badgeStatus(order.status)} />
            </View>
            <Text style={styles.meta}>
              Placed {formatDateIST(order.createdAt)}
              {order.placedByName ? ` by ${order.placedByName}` : ''}
            </Text>
            <View style={styles.divider} />
            <Row
              label={
                order.status === 'delivered' ? 'Delivered' : 'Est. Delivery'
              }
              value={
                order.estimatedDelivery
                  ? formatDateIST(order.estimatedDelivery)
                  : 'Will be updated shortly'
              }
            />
            {!!order.deliveryPartnerName && (
              <Row label="Delivery Partner" value={order.deliveryPartnerName} />
            )}
            {!!order.lrNumber && (
              <Row label="LR / Tracking No." value={order.lrNumber} />
            )}
            {!!order.dispatchDate && (
              <Row
                label="Dispatched"
                value={formatDateIST(order.dispatchDate)}
              />
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <Text style={styles.addressName}>
              {order.contactName} · {order.phone}
            </Text>
            <Text style={styles.addressText}>
              {formatAddress({
                ...order,
                id: 0,
                label: null,
                isDefault: false,
              })}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Parts ({order.items.reduce((n, i) => n + i.quantity, 0)})
            </Text>
            {order.items.map((i, idx) => (
              <View
                key={i.variantId}
                style={[styles.item, idx > 0 && styles.itemSeparator]}
              >
                <View style={styles.itemImage}>
                  {i.imageUrl ? (
                    <Image
                      source={{ uri: i.imageUrl }}
                      style={styles.itemImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <ImagePlaceholder size={30} label={null} />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{i.name}</Text>
                  <Text style={styles.itemMeta}>
                    {i.brandName} · {i.sku}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {formatPrice(i.price)} × {i.quantity}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{formatPrice(i.lineTotal)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Summary</Text>
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            {order.discountAmount > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Coupon ({order.couponCode})</Text>
                <Text style={styles.discount}>
                  − {formatPrice(order.discountAmount)}
                </Text>
              </View>
            )}
            <Row
              label={`GST (${order.gstRate}%)`}
              value={formatPrice(order.gstAmount)}
            />
            {order.shippingCharges > 0 && (
              <Row
                label="Shipping"
                value={formatPrice(order.shippingCharges)}
              />
            )}
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>
                {formatPrice(order.totalAmount)}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  retryBtn: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 4,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
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
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderNumber: { flex: 1, fontSize: 16, fontWeight: '700', color: '#161a1d' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    gap: 12,
  },
  rowLabel: { fontSize: 13, color: '#4b5563' },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#161a1d',
  },
  discount: { fontSize: 13, color: '#15803d' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#161a1d' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#161a1d' },
  addressName: { fontSize: 13, fontWeight: '600', color: '#161a1d' },
  addressText: { fontSize: 12, color: '#4b5563', lineHeight: 18, marginTop: 2 },
  item: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  itemSeparator: { borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImg: { width: '88%', height: '88%' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#161a1d' },
  itemMeta: { fontSize: 12, color: '#6b7280' },
  itemTotal: { fontSize: 13, fontWeight: '700', color: '#161a1d' },
});
