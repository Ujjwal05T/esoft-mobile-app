import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import Svg, {Path, Circle, Rect} from 'react-native-svg';
import StatusBadge, {StatusType, normalizeStatus} from '../ui/StatusBadge';
const EyeIcon = () => (
  <Svg width={20} height={13} viewBox="0 0 20 13" fill="none">
      <Path
        d="M10 0.5C5.45 0.5 1.57 3.23 0 7.125c1.57 3.895 5.45 6.625 10 6.625s8.43-2.73 10-6.625C18.43 3.23 14.55 0.5 10 0.5zm0 11.042c-2.485 0-4.5-2.015-4.5-4.5S7.515 2.542 10 2.542s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5zm0-7.2c-1.49 0-2.7 1.21-2.7 2.7s1.21 2.7 2.7 2.7 2.7-1.21 2.7-2.7-1.21-2.7-2.7-2.7z"
        fill="#E5383B"
      />
    </Svg>
);

export type OrderStatus = 'in-process' | 'shipped' | 'delivered';

export interface OrderedPart {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  vehicleName: string;
  plateNumber: string;
  orderId: string;
  placedDate: string;
  deliveryDate: string;
  totalAmount: number;
  status: OrderStatus;
  orderedParts: OrderedPart[];
}

interface OrderCardProps {
  order: Order;
  defaultExpanded?: boolean;
  onTrackOrder?: (orderId: string) => void;
  onDownloadInvoice?: (orderId: string) => void;
  onViewOrder?: (orderId: string) => void;
}

const mapStatus = (status: OrderStatus): StatusType => {
  const mapping: Record<OrderStatus, StatusType> = {
    'in-process': 'in_process',
    shipped: 'shipped',
    delivered: 'delivered',
  };
  return mapping[status];
};



const ImagePlaceholderComp = () => (
  <View style={styles.imgPlaceholder}>
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={2} stroke="#d3d3d3" strokeWidth={2} />
      <Circle cx={8.5} cy={8.5} r={1.5} fill="#d3d3d3" />
      <Path d="M21 15L16 10L5 21" stroke="#d3d3d3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </View>
);

export default function OrderCard({
  order,
  defaultExpanded = false,
  onTrackOrder,
  onDownloadInvoice,
  onViewOrder,
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const visibleParts = isExpanded ? order.orderedParts.slice(0, 3) : [];
  const remainingCount = order.orderedParts.length - 3;
  const deliveryLabel = order.status === 'delivered' ? 'Delivered at:' : 'Delivery by:';

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => setIsExpanded(v => !v)}
        activeOpacity={0.8}
        style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.flex1}>
            <Text style={styles.vehicleName}>{order.vehicleName}</Text>
            <Text style={styles.plateNumber}>{order.plateNumber}</Text>
          </View>
          <StatusBadge status={mapStatus(order.status)} />
        </View>

        <Text style={styles.orderId}>{order.orderId}</Text>
        <Text style={styles.metaText}>Placed: {order.placedDate}</Text>

        <View style={styles.deliveryRow}>
          <View>
            <Text style={styles.deliveryLabel}>{deliveryLabel}</Text>
            <Text style={styles.deliveryDate}>{order.deliveryDate}</Text>
          </View>
          <Text style={styles.totalAmount}>
            ₹{order.totalAmount.toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.partsLabel}>Ordered Parts:</Text>
          <View style={styles.partsList}>
            {visibleParts.map(part => (
              <View key={part.id} style={styles.partRow}>
                {part.imageUrl ? (
                  <Image
                    source={{uri: part.imageUrl}}
                    style={styles.partImage}
                    resizeMode="cover"
                  />
                ) : (
                  <ImagePlaceholderComp />
                )}
                <View style={styles.partInfo}>
                  <Text style={styles.partName}>{part.name}</Text>
                  <Text style={styles.partBrand}>Brand: {part.brand}</Text>
                </View>
                <View style={styles.partPrice}>
                  <Text style={styles.partPriceText}>
                    ₹{part.price.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.partQty}>Qty: {part.quantity}</Text>
                </View>
              </View>
            ))}
          </View>

          {isExpanded && remainingCount > 0 && (
            <View style={styles.moreRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.moreText}>+{remainingCount} more</Text>
            </View>
          )}

          <View style={styles.actionRow}>
            {order.status === 'delivered' ? (
              <TouchableOpacity
                onPress={() => onDownloadInvoice?.(order.id)}
                style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Download Invoice</Text>
              </TouchableOpacity>
            ) : order.status === 'shipped' ? (
              <TouchableOpacity
                onPress={() => onTrackOrder?.(order.id)}
                style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>View Delivery Details</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => onTrackOrder?.(order.id)}
                  style={[styles.actionBtn, styles.flex1]}>
                  <Text style={styles.actionBtnText}>Track order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onViewOrder?.(order.id)}
                  style={styles.trackIconBtn}>
                  <EyeIcon />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {padding: 16},
  topRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8},
  flex1: {flex: 1},
  vehicleName: {fontSize: 16, fontWeight: '600', color: '#000000'},
  plateNumber: {fontSize: 14, fontWeight: '600', color: '#e5383b'},
  orderId: {fontSize: 13, color: '#757575'},
  metaText: {fontSize: 12, color: '#9e9e9e', marginBottom: 12},
  deliveryRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  deliveryLabel: {fontSize: 12, color: '#757575'},
  deliveryDate: {fontSize: 14, fontWeight: '600', color: '#000000'},
  totalAmount: {fontSize: 18, fontWeight: '700', color: '#e5383b'},
  expandedContent: {paddingHorizontal: 16, paddingBottom: 16},
  partsLabel: {fontSize: 12, color: '#757575', marginBottom: 12},
  partsList: {gap: 12},
  partRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  partImage: {width: 60, height: 60, borderRadius: 8},
  imgPlaceholder: {
    width: 60, height: 60, borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center',
  },
  partInfo: {flex: 1},
  partName: {fontSize: 14, fontWeight: '500', color: '#000000'},
  partBrand: {fontSize: 12, color: '#757575'},
  partPrice: {alignItems: 'flex-end'},
  partPriceText: {fontSize: 14, fontWeight: '600', color: '#000000'},
  partQty: {fontSize: 12, color: '#757575'},
  moreRow: {marginTop: 16, alignItems: 'center'},
  dividerLine: {height: 1, backgroundColor: '#dadada', width: '100%'},
  moreText: {
    fontSize: 12, fontWeight: '600', color: '#e5383b',
    marginTop: -10, backgroundColor: '#ffffff', paddingHorizontal: 12,
  },
  actionRow: {flexDirection: 'row', gap: 12, marginTop: 16},
  actionBtn: {
    flex: 1, backgroundColor: '#e5383b',
    paddingVertical: 12, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: {fontSize: 13, fontWeight: '600', color: '#ffffff'},
  trackIconBtn: {
    width: 50, borderWidth: 1, borderColor: '#e5383b',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
});
