import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import {SERVER_ORIGIN} from '../../services/api';
import {useTranslation} from 'react-i18next';

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

export default function StaffCard({
  staff,
  isExpanded = false,
  onToggleExpand,
  onEdit,
  onView,
  showActions = true,
}: StaffCardProps) {
  const {t} = useTranslation();
  const avatarUri = staff.avatar?.startsWith('http')
    ? staff.avatar
    : `${SERVER_ORIGIN}${staff.avatar}`;

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
            <Text style={styles.editBtnText}>{t('staff.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onView?.()}
            style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>{t('card.view_details')}</Text>
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
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5383b',
  },
});
