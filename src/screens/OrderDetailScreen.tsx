import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import {generateInvoiceHtml} from '../utils/invoiceTemplate';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import StatusBadge from '../components/ui/StatusBadge';
import OrderItemDisputeOverlay from '../components/overlays/OrderItemDisputeOverlay';
import RaiseDisputeOverlay, {DisputeFormData} from '../components/overlays/RaiseDisputeOverlay';
import {
  getOrderById,
  createDisputeWithFiles,
  type OrderDetailApiResponse,
  type OrderItemApiResponse,
} from '../services/api';
import Svg, {Path, Rect, Circle} from 'react-native-svg';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';
import {useAuth} from '../context/AuthContext';
import {formatDateIST} from '../utils/dateUtils';

type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
type OrderDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OrderDetail'
>;

type OrderStatus = 'in-process' | 'shipped' | 'delivered';

// ── Helper Functions ──────────────────────────────────────────────────────────

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
  const {t} = useTranslation();
  const isDelivered = status === 'delivered';
  const dateLabel = isDelivered ? t('orders.delivered_at') : t('orders.delivery_by');
  const dateValue = formatDateIST(order.estimatedDeliveryDate, 'Will be updated');

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
  const placedDateStr = formatDateIST(order.createdAt);

  // Real additional charges (packing + forwarding + shipping)
  const additionalCharges =
    (order.packingCharges ?? 0) +
    (order.forwardingCharges ?? 0) +
    (order.shippingCharges ?? 0);
  const grossTotal = order.totalAmount;
  const discountAmount = order.discountAmount ?? 0;
  const amountPayable = grossTotal - discountAmount;
  const partsSubtotal = grossTotal - additionalCharges;

  return (
    <View style={styles.summaryCard}>
      {/* Vehicle info + status badge */}
      <View style={styles.summaryTop}>
        <View style={styles.summaryLeft}>
          <Text style={styles.vehicleName}>{vehicleName}</Text>
          <Text style={styles.plateNumber}>{plateNumber}</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.placedDate}>
            {t(isDelivered ? 'orders.delivered_prefix' : 'orders.placed_prefix')}
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
          <Text style={styles.amountLabel}>{t('orders.parts_subtotal')}</Text>
          <Text style={styles.amountValue}>
            Rs. {partsSubtotal.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Amounts row 2 */}
      <View style={styles.amountRow}>
        {additionalCharges > 0 && (
          <View style={[styles.amountColumn, {flex: 1}]}>
            <Text style={styles.amountLabel}>
              {t('vehicle.additional_charges')}
            </Text>
            <Text style={styles.amountValue}>
              Rs. {additionalCharges.toLocaleString('en-IN')}
            </Text>
          </View>
        )}
        <View style={[styles.amountColumnRight, {flex: 1}]}>
          <Text style={styles.amountLabel}>{t('orders.grand_total')}</Text>
          <Text style={styles.amountValue}>
            Rs. {amountPayable.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Coupon row */}
      {!!order.couponCode && discountAmount > 0 && (
        <View style={styles.couponRow}>
          <View style={styles.couponBadge}>
            <Text style={styles.couponBadgeText}>{order.couponCode}</Text>
          </View>
          <Text style={styles.couponDiscount}>
            −Rs. {discountAmount.toLocaleString('en-IN')} {t('orders.coupon_discount')}
          </Text>
        </View>
      )}
    </View>
  );
};

const DeliveryDetailsSection = ({order}: {order: OrderDetailApiResponse}) => {
  const {t} = useTranslation();
  const [open, setOpen] = useState(true);

  return (
    <View style={styles.deliverySection}>
      {/* Section header */}
      <TouchableOpacity
        style={styles.deliveryHeader}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}>
        <Text style={styles.deliveryHeaderText}>{t('vehicle.delivery_details')}</Text>
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
              label={t('vehicle.lr_tracking')}
              value={order.lrNumber ?? '–'}
            />
            <InfoColumn
              label={t('vehicle.bus_delivery_service')}
              value={order.deliveryPartnerName ?? '–'}
            />
            <InfoColumn
              label={t('vehicle.bus_delivery_contact')}
              value={order.workshopPhone ?? '–'}
            />
          </View>
          {/* Row 2 */}
          <View style={styles.deliveryRow}>
            <InfoColumn
              label={t('vehicle.delivery_driver_name')}
              value={order.deliveryDriverName ?? '–'}
            />
            <InfoColumn
              label={t('vehicle.delivery_driver_contact')}
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
  const {t} = useTranslation();
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
        {/* Dispute affordance */}
        <View style={styles.disputeBadgeRow}>
          <View style={styles.disputeBadge}>
            <Text style={styles.disputeBadgeText}>{t('orders.raise_dispute')}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<OrderDetailNavigationProp>();
  const route = useRoute<OrderDetailRouteProp>();
  const {orderId} = route.params;
  const {user} = useAuth();

  const [order, setOrder] = useState<OrderDetailApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItemApiResponse | null>(null);
  const [showDisputeOverlay, setShowDisputeOverlay] = useState(false);
  const [showRaiseDisputeOverlay, setShowRaiseDisputeOverlay] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
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
  }, [orderId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchOrder()]);
    setRefreshing(false);
  }, [fetchOrder]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  const status: OrderStatus = order ? mapStatus(order.status) : 'in-process';

  const handleDownloadInvoice = async () => {
    if (!order || invoiceLoading) return;
    console.log('[Invoice] Starting generation for order:', order.orderNumber);
    setInvoiceLoading(true);
    try {
      console.log('[Invoice] Generating HTML...');
      const html = generateInvoiceHtml(order);
      console.log('[Invoice] HTML generated, length:', html.length);

      const pdfOptions = {
        html,
        fileName: `Invoice_${order.orderNumber}`,
        base64: true,
      };
      console.log('[Invoice] Converting to PDF...');
      if (!generatePDF) {
        throw new Error('generatePDF native module not linked — rebuild the app');
      }
      const pdf = await generatePDF(pdfOptions);
      console.log('[Invoice] PDF result pages:', pdf.numberOfPages, 'base64 length:', pdf.base64?.length);

      if (!pdf.base64) throw new Error('PDF generation returned no base64 data');

      const fileName = `Invoice_${order.orderNumber}.pdf`;

      // 1. Save directly to Downloads (works on Android 10 with requestLegacyExternalStorage,
      //    and on Android 11+ falls back to app external storage silently)
      const dlPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      await RNFS.writeFile(dlPath, pdf.base64, 'base64');

      setAppAlert({
        type: 'success',
        title: t('orders.invoice_saved_title'),
        message: t('orders.invoice_saved_downloads'),
      });
    } catch (err: any) {
      console.log('[Invoice] Error:', err?.message, err);
      if (!err?.message?.includes('cancel')) {
        setAppAlert({type: 'error', title: t('common.failed'), message: t('orders.invoice_error')});
      }
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleTrack = () => {
    setAppAlert({type: 'info', title: t('orders.track_order'), message: t('orders.track_coming_soon')});
  };

  const handlePartClick = (item: OrderItemApiResponse) => {
    setSelectedItem(item);
    setShowDisputeOverlay(true);
  };

  const handleRaiseDispute = (_item: OrderItemApiResponse) => {
    setShowDisputeOverlay(false);
    // Small delay so the first overlay closes before the second opens
    setTimeout(() => setShowRaiseDisputeOverlay(true), 300);
  };

  const handleDisputeConfirm = async (data: DisputeFormData) => {
    if (!order || !user) return;
    const images = data.images.filter(Boolean);
    const result = await createDisputeWithFiles(
      order.id,
      user.workshopOwnerId ?? user.id,
      data.partName,
      data.reason,
      data.remark,
      data.partId ? Number(data.partId) : undefined,
      data.audioPath ? {uri: data.audioPath, name: 'audio.m4a', type: 'audio/m4a'} : undefined,
      images[0] ? {uri: images[0].uri, name: images[0].name, type: 'image/jpeg'} : undefined,
      images[1] ? {uri: images[1].uri, name: images[1].name, type: 'image/jpeg'} : undefined,
      images[2] ? {uri: images[2].uri, name: images[2].name, type: 'image/jpeg'} : undefined,
      user.role === 'staff' ? user.id : undefined,
    );
    if (result.success) {
      setShowRaiseDisputeOverlay(false);
      setSelectedItem(null);
      setAppAlert({type: 'success', title: t('orders.dispute_raised_title'), message: t('orders.dispute_raised_msg', {partName: data.partName})});
    } else {
      setAppAlert({type: 'error', title: t('common.failed'), message: result.error ?? t('common.something_wrong')});
    }
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e5383b" />
          <Text style={styles.loadingText}>{t('orders.loading_orders')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ───────────────────────────────────────────────────
  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>{t('orders.failed_to_load')}</Text>
          <Text style={styles.errorText}>{error || t('orders.order_not_found')}</Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Text style={styles.goBackButtonText}>{t('screen.go_back')}</Text>
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
          <Text style={styles.headerTitle}>{t('orders.details')}</Text>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#e5383b']}
            tintColor="#e5383b"
          />
        }>
        {/* Order Summary */}
        <OrderSummaryCard order={order} status={status} />

        {/* Delivery Details */}
        <DeliveryDetailsSection order={order} />

        {/* Parts header */}
        <Text style={styles.partsHeader}>{t('orders.ordered_parts')}</Text>

        {/* Parts list */}
        <View style={styles.partsList}>
          {order.items.length === 0 ? (
            <View style={styles.emptyParts}>
              <Text style={styles.emptyPartsText}>{t('orders.no_parts')}</Text>
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
              style={[styles.primaryButton, invoiceLoading && styles.primaryButtonDisabled]}
              onPress={handleDownloadInvoice}
              activeOpacity={0.8}
              disabled={invoiceLoading}>
              {invoiceLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <DownloadIcon />}
              <Text style={styles.primaryButtonText}>
                {invoiceLoading ? t('orders.invoice_generating') : t('orders.download_invoice')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, styles.flexButton, invoiceLoading && styles.primaryButtonDisabled]}
                onPress={handleDownloadInvoice}
                activeOpacity={0.8}
                disabled={invoiceLoading}>
                {invoiceLoading && <ActivityIndicator size="small" color="#fff" style={{marginRight: 6}} />}
                <Text style={styles.primaryButtonText}>
                  {invoiceLoading ? t('orders.invoice_generating') : t('orders.download_invoice')}
                </Text>
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
          deliveryDateStr={formatDateIST(order?.estimatedDeliveryDate)}
          onRaiseDispute={handleRaiseDispute}
        />
      )}

      {/* Raise Dispute Overlay — pre-filled from selected item */}
      <RaiseDisputeOverlay
        isOpen={showRaiseDisputeOverlay}
        onClose={() => {
          setShowRaiseDisputeOverlay(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDisputeConfirm}
        buttonText={user?.role === 'staff' ? t('inquiry.send_request_btn') : t('inquiry.confirm_btn')}
        orders={
          order
            ? [{
                id: String(order.id),
                orderId: order.orderNumber,
                date: formatDateIST(order.createdAt),
                parts: order.items.map(i => ({id: String(i.id), name: i.partName})),
              }]
            : []
        }
        initialOrderId={order ? String(order.id) : undefined}
        initialOrderDisplay={order?.orderNumber}
        initialPartId={selectedItem ? String(selectedItem.id) : undefined}
        initialPartName={selectedItem?.partName}
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

  // Coupon
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  couponBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  couponDiscount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
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
  disputeBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  disputeBadge: {
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  disputeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#e5383b',
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
  primaryButtonDisabled: {
    opacity: 0.6,
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
