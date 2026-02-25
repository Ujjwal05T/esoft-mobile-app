import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Svg, {Path} from 'react-native-svg';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatar: string;
  address?: string;
  isActive?: boolean;
}

interface StaffCardProps {
  staff: StaffMember;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  showActions?: boolean;
}

const EyeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
      stroke="#e5383b"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="#e5383b"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const API_BASE = 'http://192.168.1.23:5196';

export default function StaffCard({
  staff,
  isExpanded = false,
  onToggleExpand,
  onEdit,
  onView,
  showActions = true,
}: StaffCardProps) {
  const avatarUri = staff.avatar?.startsWith('http')
    ? staff.avatar
    : `${API_BASE}${staff.avatar}`;

  return (
    <TouchableOpacity
      onPress={onToggleExpand}
      activeOpacity={0.85}
      style={styles.card}>
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatarBox}>
          <Image
            source={{uri: avatarUri}}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{staff.name}</Text>
          <Text style={styles.role}>{staff.role}</Text>
          <Text style={styles.phone}>{staff.phone}</Text>
        </View>
      </View>

      {/* Expanded Actions */}
      {isExpanded && showActions && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={e => {
              onEdit?.();
            }}
            style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onView?.()}
            style={styles.viewBtn}>
            <EyeIcon />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    paddingTop: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5383b',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5383b',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#e5383b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  viewBtn: {
    width: 56,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
