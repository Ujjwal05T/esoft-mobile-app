import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import StatusBadge, {StatusType} from '../ui/StatusBadge';

export type QuoteStatus = Extract<StatusType, 'pending_review' | 'accepted'>;

export interface QuoteItem {
  id: string;
  itemName: string;
  brand?: string;
  mrp?: number;
  price: number;
  quantity: number;
  isAvailable: boolean;
  imageUrl?: string;
}

export interface Quote {
  id: string;
  vehicleName: string;
  plateNumber: string;
  quoteId: string;
  submittedDate: string;
  status: QuoteStatus;
  items: QuoteItem[];
  estimatedTotal: number;
}

interface QuoteCardProps {
  quote: Quote;
  isExpanded: boolean;
  onToggle: () => void;
  showNumberPlate?: boolean;
  onAccept?: (id: string) => void;
  onView?: (id: string) => void;
  maxVisibleAvailable?: number;
  maxVisibleUnavailable?: number;
}

const ViewIcon = () => (
  <Svg width={20} height={13} viewBox="0 0 20 13" fill="none">
    <Path
      d="M10 0.5C5.45 0.5 1.57 3.23 0 7.125c1.57 3.895 5.45 6.625 10 6.625s8.43-2.73 10-6.625C18.43 3.23 14.55 0.5 10 0.5zm0 11.042c-2.485 0-4.5-2.015-4.5-4.5S7.515 2.542 10 2.542s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5zm0-7.2c-1.49 0-2.7 1.21-2.7 2.7s1.21 2.7 2.7 2.7 2.7-1.21 2.7-2.7-1.21-2.7-2.7-2.7z"
      fill="#E5383B"
    />
  </Svg>
);

const ItemPlaceholder = () => (
  <Svg width={48} height={48} viewBox="0 0 80 80" fill="none">
    <Rect x={4} y={4} width={72} height={72} rx={8} stroke="#d3d3d3" strokeWidth={2} fill="none" />
    <Path d="M40 30c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8z" fill="#d3d3d3" />
    <Path d="M20 55l12-12 6 6 12-12 10 10v8c0 2.2-1.8 4-4 4H24c-2.2 0-4-1.8-4-4v-0z" fill="#d3d3d3" />
  </Svg>
);

const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

export default function QuoteCard({
  quote,
  isExpanded,
  onToggle,
  showNumberPlate = true,
  onAccept,
  onView,
  maxVisibleAvailable = 2,
  maxVisibleUnavailable = 2,
}: QuoteCardProps) {
  const isAccepted = quote.status === 'accepted';
  const availableItems = quote.items.filter(i => i.isAvailable);
  const unavailableItems = quote.items.filter(i => !i.isAvailable);
  const visibleAvailable = availableItems.slice(0, maxVisibleAvailable);
  const extraAvailable = Math.max(0, availableItems.length - maxVisibleAvailable);
  const visibleUnavailable = unavailableItems.slice(0, maxVisibleUnavailable);
  const extraUnavailable = Math.max(0, unavailableItems.length - maxVisibleUnavailable);

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.flex1}>
            <Text style={styles.vehicleName}>{quote.vehicleName}</Text>
            {showNumberPlate && (
              <Text style={styles.plateNumber}>{quote.plateNumber}</Text>
            )}
          </View>
          <StatusBadge status={quote.status} />
        </View>

        <Text style={styles.quoteId}>{quote.quoteId}</Text>
        <Text style={styles.dateText}>Submitted: {quote.submittedDate}</Text>

        <View style={styles.divider} />

        {!isExpanded && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Estimated Total:</Text>
            <Text style={styles.totalValue}>{formatPrice(quote.estimatedTotal)}</Text>
          </View>
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Available Parts */}
          {availableItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Parts:</Text>
              <View style={styles.itemList}>
                {visibleAvailable.map(item => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemImageBox}>
                      {item.imageUrl ? (
                        <Image
                          source={{uri: item.imageUrl}}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <ItemPlaceholder />
                      )}
                    </View>
                    <View style={styles.itemDetails}>
                      <View style={styles.flex1}>
                        <Text style={styles.itemName}>{item.itemName}</Text>
                        {item.brand && (
                          <Text style={styles.itemMeta}>Brand: {item.brand}</Text>
                        )}
                        {item.mrp && (
                          <Text style={styles.itemMeta}>MRP: {formatPrice(item.mrp)}</Text>
                        )}
                      </View>
                      <View style={styles.priceCol}>
                        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                        <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              {extraAvailable > 0 && (
                <Text style={styles.moreText}>+{extraAvailable} more</Text>
              )}
            </View>
          )}

          {/* Unavailable Parts */}
          {unavailableItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.unavailableTitle}>Unavailable Parts:</Text>
              <View style={styles.itemList}>
                {visibleUnavailable.map(item => (
                  <View key={item.id} style={[styles.itemRow, styles.unavailableItem]}>
                    <View style={[styles.itemImageBoxSmall]}>
                      {item.imageUrl ? (
                        <Image
                          source={{uri: item.imageUrl}}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <ItemPlaceholder />
                      )}
                    </View>
                    <View style={styles.itemDetails}>
                      <View style={styles.flex1}>
                        <Text style={styles.itemName}>{item.itemName}</Text>
                        {item.brand && (
                          <Text style={styles.itemMeta}>Brand: {item.brand}</Text>
                        )}
                      </View>
                      <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {extraUnavailable > 0 && (
                <Text style={styles.moreText}>+{extraUnavailable} more</Text>
              )}
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Estimated Total:</Text>
            <Text style={styles.totalValue}>{formatPrice(quote.estimatedTotal)}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => onAccept?.(quote.id)}
              disabled={isAccepted}
              style={[styles.acceptBtn, isAccepted && styles.acceptBtnDisabled]}>
              <Text style={styles.acceptBtnText}>
                {isAccepted ? 'Order Placed' : 'Accept Quote'}
              </Text>
            </TouchableOpacity>
            {onView && (
              <TouchableOpacity
                onPress={() => onView(quote.id)}
                style={styles.viewBtn}>
                <ViewIcon />
              </TouchableOpacity>
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
    borderRadius: 17,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  flex1: {flex: 1},
  vehicleName: {fontSize: 14, fontWeight: '600', color: '#4c4c4c'},
  plateNumber: {fontSize: 17, fontWeight: '700', color: '#e5383b'},
  quoteId: {fontSize: 14, fontWeight: '700', color: '#e8353b'},
  dateText: {fontSize: 12, fontWeight: '500', color: '#828282', marginBottom: 12},
  divider: {height: 1, backgroundColor: '#dadada', marginVertical: 12},
  totalRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8},
  totalLabel: {fontSize: 14, fontWeight: '500', color: '#828282'},
  totalValue: {fontSize: 20, fontWeight: '700', color: '#000000'},
  expandedContent: {paddingHorizontal: 16, paddingBottom: 16},
  section: {marginBottom: 16},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 12},
  unavailableTitle: {fontSize: 14, fontWeight: '600', color: '#828282', marginBottom: 12},
  itemList: {gap: 16},
  itemRow: {flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  unavailableItem: {opacity: 0.6},
  itemImageBox: {
    width: 80, height: 80, borderRadius: 12,
    borderWidth: 1, borderColor: '#d3d3d3',
    backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImageBoxSmall: {
    width: 60, height: 60, borderRadius: 8,
    borderWidth: 1, borderColor: '#d3d3d3',
    backgroundColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImage: {width: '100%', height: '100%'},
  itemDetails: {flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  itemName: {fontSize: 14, fontWeight: '500', color: '#e5383b', marginBottom: 2},
  itemMeta: {fontSize: 12, color: '#525252', marginBottom: 2},
  priceCol: {alignItems: 'flex-end'},
  itemPrice: {fontSize: 14, fontWeight: '700', color: '#000000'},
  itemQty: {fontSize: 12, fontWeight: '500', color: '#828282'},
  moreText: {fontSize: 14, fontWeight: '600', color: '#e5383b', textAlign: 'center', marginTop: 12},
  actionRow: {flexDirection: 'row', gap: 8, marginTop: 16},
  acceptBtn: {flex: 1, backgroundColor: '#e5383b', height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  acceptBtnDisabled: {backgroundColor: '#828282'},
  acceptBtnText: {fontSize: 14, fontWeight: '600', color: '#ffffff'},
  viewBtn: {width: 100, borderWidth: 1, borderColor: '#e5383b', height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
});
