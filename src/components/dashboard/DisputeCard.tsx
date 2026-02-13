import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import StatusBadge, {StatusType} from '../ui/StatusBadge';

export type DisputeStatus = Extract<StatusType, 'open' | 'closed' | 'declined'>;
export type DisputeAction = 'edit' | 'accept' | 'chat';

export interface DisputeMedia {
  id: string;
  type: 'image' | 'audio';
  url: string;
  duration?: number;
}

export interface Dispute {
  id: string;
  vehicleName: string;
  plateNumber: string;
  receivedDate?: string;
  openedDate?: string;
  closedDate?: string;
  status: DisputeStatus;
  disputeRaised: string;
  resolutionStatus?: string;
  media?: DisputeMedia[];
  newNotifications?: number;
  newMessages?: number;
  showVehicleInfo?: boolean;
  action?: DisputeAction;
}

interface DisputeCardProps {
  dispute: Dispute;
  onEdit?: (id: string) => void;
  onAccept?: (id: string) => void;
  onView?: (id: string) => void;
  onChat?: (id: string) => void;
}

const ViewIcon = () => (
  <Svg width={20} height={13} viewBox="0 0 20 13" fill="none">
    <Path
      d="M10 0.5C5.45 0.5 1.57 3.23 0 7.125c1.57 3.895 5.45 6.625 10 6.625s8.43-2.73 10-6.625C18.43 3.23 14.55 0.5 10 0.5zm0 11.042c-2.485 0-4.5-2.015-4.5-4.5S7.515 2.542 10 2.542s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5zm0-7.2c-1.49 0-2.7 1.21-2.7 2.7s1.21 2.7 2.7 2.7 2.7-1.21 2.7-2.7-1.21-2.7-2.7-2.7z"
      fill="#E5383B"
    />
  </Svg>
);

export default function DisputeCard({
  dispute,
  onEdit,
  onAccept,
  onView,
  onChat,
}: DisputeCardProps) {
  const showVehicleInfo = dispute.showVehicleInfo !== false;
  const action = dispute.action || 'edit';

  const getDateText = () => {
    if (dispute.closedDate) return `Closed: ${dispute.closedDate}`;
    if (dispute.openedDate) return `Opened: ${dispute.openedDate}`;
    return `Received: ${dispute.receivedDate || ''}`;
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.flex1}>
          {showVehicleInfo && (
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{dispute.vehicleName}</Text>
              <Text style={styles.plateNumber}>{dispute.plateNumber}</Text>
            </View>
          )}
          <Text style={styles.disputeId}>{dispute.id}</Text>
          <Text style={styles.dateText}>{getDateText()}</Text>
        </View>

        {dispute.newNotifications && dispute.newNotifications > 0 ? (
          <Text style={styles.notificationText}>
            {dispute.newNotifications} new notification
            {dispute.newNotifications > 1 ? 's' : ''}
          </Text>
        ) : (
          <StatusBadge status={dispute.status} />
        )}
      </View>

      <View style={styles.divider} />

      {/* Dispute Details */}
      <View style={styles.detailSection}>
        <Text style={styles.disputeRaisedLabel}>Dispute raised:</Text>
        <Text style={styles.disputeRaisedValue}>{dispute.disputeRaised}</Text>
        {(action === 'chat' || dispute.status === 'closed') &&
          dispute.resolutionStatus && (
            <View style={styles.resolutionRow}>
              <Text style={styles.resolutionLabel}>Resolution status:</Text>
              <Text style={styles.resolutionValue}>
                {dispute.resolutionStatus}
              </Text>
            </View>
          )}
      </View>

      {/* Action Buttons */}
      {(action === 'edit' || action === 'accept' || action === 'chat') && (
        <View style={styles.actionRow}>
          {action === 'edit' && (
            <TouchableOpacity
              onPress={() => onEdit?.(dispute.id)}
              style={styles.mainActionBtn}>
              <Text style={styles.mainActionText}>Edit</Text>
            </TouchableOpacity>
          )}
          {action === 'accept' && (
            <TouchableOpacity
              onPress={() => onAccept?.(dispute.id)}
              style={styles.mainActionBtn}>
              <Text style={styles.mainActionText}>Accept Dispute</Text>
            </TouchableOpacity>
          )}
          {action === 'chat' && (
            <TouchableOpacity
              onPress={() => onChat?.(dispute.id)}
              style={styles.mainActionBtn}>
              <Text style={styles.mainActionText}>
                {dispute.newMessages && dispute.newMessages > 0
                  ? `${dispute.newMessages} New Message${dispute.newMessages > 1 ? 's' : ''}`
                  : 'Messages'}
              </Text>
            </TouchableOpacity>
          )}
          {onView && (
            <TouchableOpacity
              onPress={() => onView(dispute.id)}
              style={styles.viewBtn}>
              <ViewIcon />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 10,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 48,
  },
  flex1: {flex: 1},
  vehicleInfo: {marginBottom: 8},
  vehicleName: {fontSize: 14, fontWeight: '600', color: '#4c4c4c'},
  plateNumber: {fontSize: 17, fontWeight: '700', color: '#e5383b'},
  disputeId: {fontSize: 14, fontWeight: '700', color: '#e8353b'},
  dateText: {fontSize: 12, fontWeight: '500', color: '#828282'},
  notificationText: {
    fontSize: 12, fontWeight: '500', color: '#e8353b',
    textDecorationLine: 'underline',
  },
  divider: {height: 1, backgroundColor: '#dadada'},
  detailSection: {gap: 4},
  disputeRaisedLabel: {fontSize: 11, fontWeight: '600', color: '#828282', textAlign: 'center'},
  disputeRaisedValue: {fontSize: 16, fontWeight: '700', color: '#e5383b'},
  resolutionRow: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  resolutionLabel: {fontSize: 11, fontWeight: '600', color: '#828282'},
  resolutionValue: {fontSize: 11, fontWeight: '600', color: '#e5383b'},
  actionRow: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  mainActionBtn: {
    flex: 1, backgroundColor: '#e5383b',
    borderRadius: 5, paddingHorizontal: 21, paddingVertical: 9,
    height: 38, alignItems: 'center', justifyContent: 'center',
  },
  mainActionText: {fontSize: 10, fontWeight: '600', color: '#ffffff'},
  viewBtn: {
    borderWidth: 1, borderColor: '#e5383b',
    borderRadius: 5, height: 38, width: 111,
    alignItems: 'center', justifyContent: 'center',
  },
});
