import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export type StatusType =
  | 'open'
  | 'closed'
  | 'declined'
  | 'requested'
  | 'in_process'
  | 'shipped'
  | 'delivered'
  | 'pending_review'
  | 'accepted'
  | 'approved'
  | 'expired';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfigs: Record<StatusType, {bgColor: string; label: string}> = {
  open: {bgColor: '#ff6600', label: 'Open'},
  closed: {bgColor: '#289d27', label: 'Closed'},
  declined: {bgColor: '#e5383b', label: 'Declined'},
  requested: {bgColor: '#ffad2a', label: 'Requested'},
  in_process: {bgColor: '#ff6600', label: 'In Process'},
  shipped: {bgColor: '#0090ff', label: 'Shipped'},
  delivered: {bgColor: '#289d27', label: 'Delivered'},
  pending_review: {bgColor: '#ffad2a', label: 'Pending Review'},
  accepted: {bgColor: '#289d27', label: 'Accepted'},
  approved: {bgColor: '#289d27', label: 'Approved'},
  expired: {bgColor: '#e5383b', label: 'Expired'},
};

export default function StatusBadge({status, label}: StatusBadgeProps) {
  const config = statusConfigs[status];
  const displayLabel = label || config.label;

  return (
    <View style={[styles.badge, {backgroundColor: config.bgColor}]}>
      <Text style={styles.text}>{displayLabel}</Text>
    </View>
  );
}

export function getStatusConfig(status: StatusType) {
  return statusConfigs[status];
}

export function normalizeStatus(status: string): StatusType {
  const normalized = status
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_') as StatusType;

  const aliases: Record<string, StatusType> = {
    inprocess: 'in_process',
    'in-process': 'in_process',
    pendingreview: 'pending_review',
    'pending-review': 'pending_review',
  };

  return aliases[normalized] || normalized;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 7,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: -0.41,
  },
});
