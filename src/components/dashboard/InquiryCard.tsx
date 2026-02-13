import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import StatusBadge, {StatusType} from '../ui/StatusBadge';

export type InquiryStatus = Extract<
  StatusType,
  'open' | 'closed' | 'approved' | 'requested' | 'declined'
>;
export type InquiryAction = 'edit' | 're-request' | 'approve' | 'none';

export interface InquiryItem {
  id: string;
  itemName: string;
  preferredBrand?: string;
  notes?: string;
  quantity: number;
  imageUrl?: string;
}

export interface Inquiry {
  id: string;
  vehicleName?: string;
  numberPlate?: string;
  placedDate: string;
  closedDate?: string;
  declinedDate?: string;
  status: InquiryStatus;
  inquiryBy: string;
  jobCategory: string;
  items: InquiryItem[];
  media?: {id: string; type: string; url: string}[];
}

interface InquiryCardProps {
  inquiry: Inquiry;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onReRequest?: (id: string) => void;
  onApprove?: (id: string) => void;
  showNumberPlate?: boolean;
  action?: InquiryAction;
  maxVisibleItems?: number;
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

export default function InquiryCard({
  inquiry,
  isExpanded,
  onToggle,
  onEdit,
  onView,
  onReRequest,
  onApprove,
  showNumberPlate = true,
  action = 'edit',
  maxVisibleItems = 3,
}: InquiryCardProps) {
  const visibleItems = inquiry.items?.slice(0, maxVisibleItems) || [];
  const extraItemsCount = Math.max(
    0,
    (inquiry.items?.length || 0) - maxVisibleItems,
  );

  const effectiveAction =
    action === 'edit' && inquiry.status === 'declined' ? 're-request' : action;

  const getDateText = () => {
    if (inquiry.status === 'closed' && inquiry.closedDate) {
      return `Closed: ${inquiry.closedDate}`;
    }
    if (inquiry.status === 'declined' && inquiry.declinedDate) {
      return `Declined: ${inquiry.declinedDate}`;
    }
    return `Placed: ${inquiry.placedDate}`;
  };

  const getActionLabel = () => {
    switch (effectiveAction) {
      case 're-request': return 'Re-request';
      case 'approve': return 'Approve Inquiry';
      default: return 'Edit';
    }
  };

  const handleActionPress = () => {
    switch (effectiveAction) {
      case 're-request': onReRequest?.(inquiry.id); break;
      case 'approve': onApprove?.(inquiry.id); break;
      default: onEdit?.(inquiry.id); break;
    }
  };

  return (
    <View style={styles.card}>
      {/* Header - Tappable */}
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={styles.header}>
        {showNumberPlate && inquiry.numberPlate && (
          <View style={styles.row}>
            <View style={styles.flex1}>
              {inquiry.vehicleName && (
                <Text style={styles.vehicleName}>{inquiry.vehicleName}</Text>
              )}
              <Text style={styles.numberPlate}>{inquiry.numberPlate}</Text>
            </View>
            <StatusBadge status={inquiry.status} />
          </View>
        )}

        <View style={styles.idRow}>
          <View style={styles.flex1}>
            <Text style={styles.inquiryId}>{inquiry.id}</Text>
            {(!showNumberPlate || !inquiry.numberPlate) && (
              <StatusBadge status={inquiry.status} />
            )}
          </View>
          {(!showNumberPlate || !inquiry.numberPlate) && <View />}
        </View>
        <Text style={styles.dateText}>{getDateText()}</Text>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Inquiry by: <Text style={styles.metaRed}>{inquiry.inquiryBy}</Text>
          </Text>
          <Text style={styles.metaText}>
            Job Category: <Text style={styles.metaRed}>{inquiry.jobCategory}</Text>
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          {inquiry.items && inquiry.items.length > 0 && (
            <View style={styles.partsSection}>
              <Text style={styles.partsSectionTitle}>Required Parts:</Text>
              <View style={styles.partsList}>
                {visibleItems.map(item => (
                  <View key={item.id} style={styles.partItem}>
                    <View style={styles.partImageBox}>
                      {item.imageUrl ? (
                        <Image
                          source={{uri: item.imageUrl}}
                          style={styles.partImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <ItemPlaceholder />
                      )}
                    </View>
                    <View style={styles.partDetails}>
                      <View style={styles.flex1}>
                        <Text style={styles.itemName}>{item.itemName}</Text>
                        {item.preferredBrand && (
                          <Text style={styles.itemMeta}>
                            Preferred Brand: {item.preferredBrand}
                          </Text>
                        )}
                        {item.notes && (
                          <Text style={styles.itemMeta}>Notes: {item.notes}</Text>
                        )}
                      </View>
                      <Text style={styles.qty}>Qty: {item.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {extraItemsCount > 0 && (
                <View style={styles.moreIndicator}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.moreText}>+{extraItemsCount} more</Text>
                </View>
              )}
            </View>
          )}

          {effectiveAction !== 'none' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleActionPress}
                style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>{getActionLabel()}</Text>
              </TouchableOpacity>
              {onView && (
                <TouchableOpacity
                  onPress={() => onView(inquiry.id)}
                  style={styles.viewBtn}>
                  <ViewIcon />
                </TouchableOpacity>
              )}
            </View>
          )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  flex1: {flex: 1},
  vehicleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4c4c4c',
  },
  numberPlate: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e5383b',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inquiryId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e8353b',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#828282',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#dadada',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  metaRed: {
    color: '#e5383b',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  partsSection: {
    marginBottom: 16,
  },
  partsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  partsList: {
    gap: 16,
  },
  partItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  partImageBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d3d3d3',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  partImage: {
    width: '100%',
    height: '100%',
  },
  partDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5383b',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: '#525252',
    marginBottom: 2,
  },
  qty: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  moreIndicator: {
    marginTop: 16,
    alignItems: 'center',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#dadada',
    width: '100%',
  },
  moreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5383b',
    marginTop: -10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#e5383b',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  viewBtn: {
    width: 100,
    borderWidth: 1,
    borderColor: '#e5383b',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
