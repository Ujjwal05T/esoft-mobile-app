import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Header from '../components/dashboard/Header';
import OrderCard, {Order, OrderStatus} from '../components/dashboard/OrderCard';
import {
  getStoredUser,
  getOrdersByWorkshopId,
  getOrderById,
  type WorkshopOrderListItem,
} from '../services/api';
import type {RootStackParamList} from '../navigation/RootNavigator';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapStatus(backendStatus: string): OrderStatus {
  switch (backendStatus) {
    case 'shipped':
      return 'shipped';
    case 'delivered':
      return 'delivered';
    default:
      return 'in-process';
  }
}

// ── Main Screen ───────────────────────────────────────────────────────────────

type OrdersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await getStoredUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const res = await getOrdersByWorkshopId(user.id);
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to load orders.');
        setIsLoading(false);
        return;
      }

      // Fetch full details for all orders in parallel to get items
      const detailResults = await Promise.all(
        res.data.orders.map((o: WorkshopOrderListItem) => getOrderById(o.id)),
      );

      const mapped: Order[] = res.data.orders.map(
        (o: WorkshopOrderListItem, idx: number) => {
          const detail = detailResults[idx];
          const items = detail.success && detail.data ? detail.data.items : [];
          const estimatedDelivery =
            detail.success && detail.data?.estimatedDeliveryDate
              ? formatDate(detail.data.estimatedDeliveryDate)
              : '–';

          return {
            id: String(o.id),
            vehicleName: o.vehicleName ?? o.orderNumber,
            plateNumber: o.plateNumber ?? '',
            orderId: o.orderNumber,
            placedDate: formatDate(o.createdAt),
            deliveryDate: estimatedDelivery,
            totalAmount: o.totalAmount,
            status: mapStatus(o.status),
            orderedParts: items.map(item => ({
              id: String(item.id),
              name: item.partName,
              brand: item.brand,
              price: item.unitPrice,
              quantity: item.quantity,
            })),
          };
        },
      );

      setOrders(mapped);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      {/* <Header /> */}

      {/* ── Title Bar ────────────────────────────────────────────────── */}
      <View style={styles.titleBar}>
        <Text style={styles.title}>My Orders</Text>
        {/* <Text style={styles.subtitle}>Track and manage your orders</Text> */}
      </View>

      {/* ── Loading State ─────────────────────────────────────────────── */}
      {isLoading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e5383b" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      )}

      {/* ── Error State ───────────────────────────────────────────────── */}
      {error !== null && !isLoading && (
        <View style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={fetchOrders}
            activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Empty State ───────────────────────────────────────────────── */}
      {!isLoading && error === null && orders.length === 0 && (
        <View style={styles.stateCard}>
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
        </View>
      )}

      {/* ── Orders List ───────────────────────────────────────────────── */}
      {!isLoading && error === null && orders.length > 0 && (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            {paddingBottom: insets.bottom + 120},
          ]}
          showsVerticalScrollIndicator={false}>
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onTrackOrder={orderId =>
                navigation.navigate('OrderDetail', {orderId: parseInt(orderId)})
              }
              onDownloadInvoice={orderId => console.log('Invoice:', orderId)}
              onViewOrder={orderId => navigation.navigate('OrderDetail', {orderId: parseInt(orderId)})}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},

  // Title bar
  titleBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {fontSize: 24, fontWeight: '700', color: '#e85383'},
  subtitle: {fontSize: 14, color: '#757575', marginTop: 4},

  // States
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {fontSize: 14, color: '#757575'},
  stateCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {fontSize: 14, color: '#e5383b', textAlign: 'center'},
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#e5383b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {color: '#ffffff', fontSize: 14, fontWeight: '500'},
  emptyTitle: {fontSize: 16, fontWeight: '500', color: '#2b2b2b'},
  emptySubtitle: {fontSize: 14, color: '#99a2b6', textAlign: 'center'},

  // List
  listContent: {
    padding: 16,
    gap: 16,
  },
});
