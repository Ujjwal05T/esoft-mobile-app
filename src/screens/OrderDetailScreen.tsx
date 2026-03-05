import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import StatusBadge from '../components/ui/StatusBadge';
import OrderItemDisputeOverlay from '../components/overlays/OrderItemDisputeOverlay';
import {
  getOrderById,
  type OrderDetailApiResponse,
  type OrderItemApiResponse,
} from '../services/api';
import Svg, {Path, Rect, Circle} from 'react-native-svg';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';

type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
type OrderDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OrderDetail'
>;

type OrderStatus = 'in-process' | 'shipped' | 'delivered';

// ── Helper Functions ──────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapStatus(s: string): OrderStatus {
  switch (s?.toLowerCase()) {
    case 'shipped':
      return 'shipped';
    case 'delivered':
      return 'delivered';
    default:
      return 'in-process';
  }
}

function mapStatusType(s: OrderStatus) {
  const m: Record<OrderStatus, 'in_process' | 'shipped' | 'delivered'> = {
    'in-process': 'in_process',
    shipped: 'shipped',
    delivered: 'delivered',
  };
  return m[s];
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke="#1a1a1a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronIcon = ({open}: {open: boolean}) => (
  <Svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      transform: [{rotate: open ? '180deg' : '0deg'}],
    }}>
    <Path
      d="M6 9L12 15L18 9"
      stroke="#2b2b2b"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ImagePlaceholder = () => (
  <View style={styles.imagePlaceholder}>
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={3}
        width={18}
        height={18}
        rx={2}
        stroke="#d3d3d3"
        strokeWidth={2}
      />
      <Circle cx={8.5} cy={8.5} r={1.5} fill="#d3d3d3" />
      <Path
        d="M21 15L16 10L5 21"
        stroke="#d3d3d3"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

const DownloadIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3v13M7 11l5 5 5-5M20 21H4"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrackIcon = () => (
  <Svg width={20} height={13} viewBox="0 0 20 13" fill="none">
    <Path
      d="M1 6.5H19M19 6.5L14 1.5M19 6.5L14 11.5"
      stroke="#e5383b"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Sub-components ────────────────────────────────────────────────────────────

const InfoColumn = ({label, value}: {label: string; value: string}) => (
  <View style={styles.infoColumn}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '–'}</Text>
  </View>
);

const OrderSummaryCard = ({order, status}: {order: OrderDetailApiResponse; status: OrderStatus}) => {
  const isDelivered = status === 'delivered';
  const dateLabel = isDelivered ? 'Delivered at:' : 'Delivery by:';
  const dateValue = formatDate(order.estimatedDeliveryDate);

  // Build vehicle name from brand + model if vehicleName is null
  const apiVehicleName =
    order.vehicleName ||
    [order.vehicleBrand, order.vehicleModel, order.vehicleVariant]
      .filter(Boolean)
      .join(' ') ||
    '';
  const vehicleName = apiVehicleName || '–';
  const plateNumber = order.plateNumber || '–';

  // 'Placed at' → use createdAt from detail API
  const placedDateStr = formatDate(order.createdAt);

  // Real additional charges (packing + forwarding + shipping)
  const additionalCharges =
    (order.packingCharges ?? 0) +
    (order.forwardingCharges ?? 0) +
    (order.shippingCharges ?? 0);
  const grandTotal = order.totalAmount;
  const partsSubtotal = grandTotal - additionalCharges;

  return (
    <View style={styles.summaryCard}>
      {/* Vehicle info + status badge */}
      <View style={styles.summaryTop}>
        <View style={styles.summaryLeft}>
          <Text style={styles.vehicleName}>{vehicleName}</Text>
          <Text style={styles.plateNumber}>{plateNumber}</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.placedDate}>
            {isDelivered ? 'Delivered: ' : 'Placed: '}
            {placedDateStr}
          </Text>
        </View>
        <View style={styles.statusBadgeContainer}>
          <StatusBadge status={mapStatusType(status)} />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Delivery & amounts row 1 */}
      <View style={styles.amountRow}>
        <View style={styles.amountColumn}>
          <Text style={styles.amountLabel}>{dateLabel}</Text>
          <Text style={styles.amountValue}>{dateValue}</Text>
        </View>
        <View style={styles.amountColumnRight}>
          <Text style={styles.amountLabel}>Parts Subtotal</Text>
          <Text style={styles.amountValue}>
            Rs. {partsSubtotal.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Amounts row 2 */}
      <View style={styles.amountRow}>
        <View style={[styles.amountColumn, {flex: 1}]}>
          <Text style={styles.amountLabel}>
            Additional Charges (Packing + Forwarding + Shipping)
          </Text>
          <Text style={styles.amountValue}>
            Rs. {additionalCharges.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.amountColumnRight, {width: 80}]}>
          <Text style={styles.amountLabel}>Grand Total</Text>
          <Text style={styles.amountValue}>
            Rs. {grandTotal.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const DeliveryDetailsSection = ({order}: {order: OrderDetailApiResponse}) => {
  const [open, setOpen] = useState(true);

  return (
    <View style={styles.deliverySection}>
      {/* Section header */}
      <TouchableOpacity
        style={styles.deliveryHeader}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}>
        <Text style={styles.deliveryHeaderText}>Delivery Details</Text>
        <ChevronIcon open={open} />
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.deliveryDivider} />

      {/* Content */}
      {open && (
        <View style={styles.deliveryContent}>
          {/* Row 1 */}
          <View style={styles.deliveryRow}>
            <InfoColumn
              label="LR/Tracking No."
              value={order.lrNumber ?? '–'}
            />
            <InfoColumn
              label="Bus/Delivery Service"
              value={order.deliveryPartnerName ?? '–'}
            />
            <InfoColumn
              label="Bus/Delivery Contact No."
              value={order.workshopPhone ?? '–'}
            />
          </View>
          {/* Row 2 */}
          <View style={styles.deliveryRow}>
            <InfoColumn
              label="Delivery Driver Name"
              value={order.deliveryDriverName ?? '–'}
            />
            <InfoColumn
              label="Delivery Driver Contact No."
              value={order.deliveryDriverContact ?? '–'}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const PartRow = ({
  item,
  onClick,
}: {
  item: OrderItemApiResponse;
  onClick: () => void;
}) => {
  return (
    <TouchableOpacity
      style={styles.partRow}
      onPress={onClick}
      activeOpacity={0.7}>
      <ImagePlaceholder />
      <View style={styles.partContent}>
        {/* Brand badge */}
        <View style={styles.brandBadgeContainer}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>{item.brand || 'OEM'}</Text>
          </View>
        </View>
        {/* Name + quantity */}
        <View style={styles.partNameRow}>
          <Text style={styles.partName} numberOfLines={1}>
            {item.partName}
          </Text>
          <Text style={styles.partQuantity}>{item.quantity} pcs</Text>
        </View>
        {/* Part number + price */}
        <View style={styles.partBottomRow}>
          <Text style={styles.partNumber}>{item.partNumber || '–'}</Text>
          <Text style={styles.partPrice}>
            ₹{item.unitPrice.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const navigation = useNavigation<OrderDetailNavigationProp>();
  const route = useRoute<OrderDetailRouteProp>();
  const {orderId} = route.params;

  const [order, setOrder] = useState<OrderDetailApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItemApiResponse | null>(null);
  const [showDisputeOverlay, setShowDisputeOverlay] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const result = await getOrderById(orderId);
        if (result.success && result.data) {
          setOrder(result.data);
        } else {
          setError(result.error ?? 'Failed to load order.');
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Failed to load order.');
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const status: OrderStatus = order ? mapStatus(order.status) : 'in-process';

  const handleDownloadInvoice = () => {
    setAppAlert({type: 'info', title: 'Download Invoice', message: 'Invoice download functionality coming soon!'});
  };

  const handleTrack = () => {
    setAppAlert({type: 'info', title: 'Track Order', message: 'Order tracking functionality coming soon!'});
  };

  const handlePartClick = (item: OrderItemApiResponse) => {
    setSelectedItem(item);
    setShowDisputeOverlay(true);
  };

  const handleRaiseDispute = (item: OrderItemApiResponse) => {
    // TODO: Call raise dispute API
    setAppAlert({type: 'info', title: 'Raise Dispute', message: `Dispute raised for ${item.partName}!\n\nThis will be connected to the API soon.`});
    setShowDisputeOverlay(false);
    setSelectedItem(null);
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e5383b" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ───────────────────────────────────────────────────
  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Failed to Load Order</Text>
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconBtn}
            activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <OrderSummaryCard order={order} status={status} />

        {/* Delivery Details */}
        <DeliveryDetailsSection order={order} />

        {/* Parts header */}
        <Text style={styles.partsHeader}>Ordered Parts:</Text>

        {/* Parts list */}
        <View style={styles.partsList}>
          {order.items.length === 0 ? (
            <View style={styles.emptyParts}>
              <Text style={styles.emptyPartsText}>No parts found.</Text>
            </View>
          ) : (
            order.items.map(item => (
              <PartRow
                key={item.id}
                item={item}
                onClick={() => handlePartClick(item)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={styles.bottomCTA}>
        <View style={styles.fadeGradient} />
        <View style={styles.buttonContainer}>
          {status === 'delivered' ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleDownloadInvoice}
              activeOpacity={0.8}>
              <DownloadIcon />
              <Text style={styles.primaryButtonText}>Download Invoice</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, styles.flexButton]}
                onPress={handleDownloadInvoice}
                activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>Download Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.trackButton}
                onPress={handleTrack}
                activeOpacity={0.8}>
                <TrackIcon />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Order Item Dispute Overlay */}
      {selectedItem && (
        <OrderItemDisputeOverlay
          isOpen={showDisputeOverlay}
          onClose={() => {
            setShowDisputeOverlay(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          isDelivered={status === 'delivered'}
          deliveryDateStr={formatDate(order?.estimatedDeliveryDate)}
          onRaiseDispute={handleRaiseDispute}
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
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  goBackButton: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goBackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#e5383b',
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 10,
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 10,
    padding: 16,
    gap: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  summaryLeft: {
    flex: 1,
    gap: 6,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4c4c4c',
  },
  plateNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e5383b',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e8353b',
  },
  placedDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#828282',
  },
  statusBadgeContainer: {
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#dadada',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  amountColumn: {
    gap: 4,
  },
  amountColumnRight: {
    gap: 4,
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5383b',
  },

  // Delivery section
  deliverySection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  deliveryHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  deliveryDivider: {
    height: 1,
    backgroundColor: '#dadada',
    marginHorizontal: 16,
  },
  deliveryContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 20,
  },
  deliveryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  infoColumn: {
    gap: 5,
  },
  infoLabel: {
    fontSize: 11,
    color: '#646464',
    fontWeight: '400',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e5383b',
  },

  // Parts
  partsHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 4,
  },
  partsList: {
    gap: 5,
  },
  emptyParts: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyPartsText: {
    fontSize: 13,
    color: '#9e9e9e',
  },
  partRow: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 13,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  partContent: {
    flex: 1,
    gap: 4,
  },
  brandBadgeContainer: {
    flexDirection: 'row',
  },
  brandBadge: {
    backgroundColor: '#e4e4e4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 7,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  partNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  partName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#323232',
  },
  partQuantity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    flexShrink: 0,
  },
  partBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  partNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#939393',
  },
  partPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: '#828282',
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#e5383b',
    paddingVertical: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  flexButton: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  trackButton: {
    width: 50,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom CTA
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
  },
  fadeGradient: {
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  buttonContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 26,
  },
});
