import React, {useState, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import OrderCard, {Order, OrderStatus} from '../components/dashboard/OrderCard';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';
import VehicleSelectionOverlay, {
  type VehicleInfo,
} from '../components/overlays/VehicleSelectionOverlay';
import VehicleTypeSelectionOverlay from '../components/overlays/VehicleTypeSelectionOverlay';
import AddVehicleOverlay from '../components/overlays/AddVehicleOverlay';
import RequestPartOverlay from '../components/overlays/RequestPartOverlay';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';
import {
  getStoredUser,
  getOrdersByWorkshopId,
  getOrderById,
  getActiveVehicleVisit,
  createInquiryWithMedia,
  type WorkshopOrderListItem,
  type VehicleResponse,
  type InquiryItemRequest,
} from '../services/api';
import type {RootStackParamList} from '../navigation/RootNavigator';
import {formatDateIST} from '../utils/dateUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Overlay states
  const [showVehicleTypeSelection, setShowVehicleTypeSelection] = useState(false);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [addVehicleForOrderParts, setAddVehicleForOrderParts] = useState(false);
  const [showRequestPart, setShowRequestPart] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [activeVisitCategories, setActiveVisitCategories] = useState<string[]>([]);
  const [activeVisitId, setActiveVisitId] = useState<number | undefined>(undefined);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
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

      const detailResults = await Promise.all(
        res.data.orders.map((o: WorkshopOrderListItem) => getOrderById(o.id)),
      );

      const mapped: Order[] = res.data.orders.map(
        (o: WorkshopOrderListItem, idx: number) => {
          const detail = detailResults[idx];
          const items = detail.success && detail.data ? detail.data.items : [];
          const estimatedDelivery =
            detail.success && detail.data?.estimatedDeliveryDate
              ? formatDateIST(detail.data.estimatedDeliveryDate)
              : '–';

          return {
            id: String(o.id),
            vehicleName: o.vehicleName ?? o.orderNumber,
            plateNumber: o.plateNumber ?? '',
            orderId: o.orderNumber,
            placedDate: formatDateIST(o.createdAt),
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(true);
    setRefreshing(false);
  }, [fetchOrders]);

  useFocusEffect(useCallback(() => {
    fetchOrders();
  }, [fetchOrders]));

  // ── FAB Handlers ─────────────────────────────────────────────────────────────

  const handleRequestPart = () => setShowVehicleTypeSelection(true);

  const handleVehicleSelected = async (vehicle: VehicleResponse, _info: VehicleInfo) => {
    setSelectedVehicle(vehicle);
    const visitRes = await getActiveVehicleVisit(vehicle.id);
    setActiveVisitCategories(visitRes.data?.activeJobCategories?.length ? visitRes.data.activeJobCategories : ['Default']);
    setActiveVisitId(visitRes.data?.id);
    setShowVehicleSelection(false);
    setShowRequestPart(true);
  };

  const handleNewVehicleCreatedForOrderParts = async (vehicleId: number) => {
    setSelectedVehicle({id: vehicleId} as VehicleResponse);
    const visitRes = await getActiveVehicleVisit(vehicleId);
    setActiveVisitCategories(visitRes.data?.activeJobCategories?.length ? visitRes.data.activeJobCategories : ['Default']);
    setActiveVisitId(visitRes.data?.id);
    setAddVehicleForOrderParts(false);
    setShowRequestPart(true);
  };

  const handleRequestPartSubmit = async (parts: any[]) => {
    try {
      const user = await getStoredUser();
      if (!user || !selectedVehicle) {
        setAppAlert({type: 'error', message: 'User or vehicle not found. Please try again.'});
        return;
      }

      const audioFiles: any[] = [];
      const imageFiles: any[] = [];

      const items: InquiryItemRequest[] = parts.map(part => {
        if (part.audioPath) {
          audioFiles.push({
            uri: part.audioPath,
            name: `audio_${Date.now()}_${audioFiles.length}.mp4`,
            type: 'audio/mp4',
          });
        }
        part.images.forEach((img: any) => {
          if (img?.uri) {
            imageFiles.push({
              uri: img.uri,
              name: img.name || `image_${Date.now()}_${imageFiles.length}.jpg`,
              type: 'image/jpeg',
            });
          }
        });

        return {
          partName: part.partName,
          preferredBrand: part.preferredBrand,
          quantity: parseInt(part.quantity, 10) || 1,
          remark: part.remark,
          audioDuration: part.audioDuration || undefined,
        };
      });

      const result = await createInquiryWithMedia(
        selectedVehicle.id,
        user.id,
        activeVisitCategories,
        items,
        audioFiles,
        imageFiles,
        activeVisitId,
        null,
      );

      if (result.success) {
        setAppAlert({
          type: 'success',
          message: `Inquiry created successfully!\n\nInquiry Number: ${result.data?.inquiryNumber || 'N/A'}`,
          onDone: () => setShowRequestPart(false),
        });
      } else {
        setAppAlert({type: 'error', message: result.error || 'Failed to create inquiry'});
      }
    } catch {
      setAppAlert({type: 'error', message: 'An error occurred while creating the inquiry'});
    }
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* ── Title Bar ────────────────────────────────────────────────── */}
      <View style={styles.titleBar}>
        <Text style={styles.title}>{t('orders.title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          {paddingBottom: insets.bottom + 120},
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#e5383b']}
            tintColor="#e5383b"
          />
        }>

        {/* ── Loading State ─────────────────────────────────────────── */}
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#e5383b" />
            <Text style={styles.loadingText}>{t('orders.loading_orders')}</Text>
          </View>
        )}

        {/* ── Error State ───────────────────────────────────────────── */}
        {error !== null && !isLoading && (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => fetchOrders()}
              activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>{t('screen.try_again')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Empty State ───────────────────────────────────────────── */}
        {!isLoading && error === null && orders.length === 0 && (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>{t('orders.no_orders')}</Text>
            <Text style={styles.emptySubtitle}>{t('orders.no_orders_subtitle')}</Text>
          </View>
        )}

        {/* ── Orders List ───────────────────────────────────────────── */}
        {!isLoading && error === null && orders.length > 0 && orders.map(order => (
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

      {/* ── Floating Action Button ───────────────────────────────────── */}
      <FloatingActionButton
        navigationOptions={[
          {label: t('vehicle.request_part'), onPress: handleRequestPart},
        ]}
      />

      {/* ── Vehicle Type Selection Overlay ──────────────────────────── */}
      <VehicleTypeSelectionOverlay
        isOpen={showVehicleTypeSelection}
        onClose={() => setShowVehicleTypeSelection(false)}
        onSelectExisting={() => {
          setShowVehicleTypeSelection(false);
          setShowVehicleSelection(true);
        }}
        onSelectNew={() => {
          setShowVehicleTypeSelection(false);
          setAddVehicleForOrderParts(true);
        }}
      />

      {/* ── Add Vehicle Overlay (for order parts) ───────────────────── */}
      <AddVehicleOverlay
        isOpen={addVehicleForOrderParts}
        onClose={() => setAddVehicleForOrderParts(false)}
        onVehicleCreated={handleNewVehicleCreatedForOrderParts}
      />

      {/* ── Vehicle Selection Overlay ────────────────────────────────── */}
      <VehicleSelectionOverlay
        isOpen={showVehicleSelection}
        onClose={() => setShowVehicleSelection(false)}
        onVehicleSelected={handleVehicleSelected}
        title={t('orders.select_vehicle_parts')}
      />

      {/* ── Request Part Overlay ─────────────────────────────────────── */}
      {selectedVehicle && (
        <RequestPartOverlay
          isOpen={showRequestPart}
          onClose={() => setShowRequestPart(false)}
          onSubmit={handleRequestPartSubmit}
        />
      )}

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
