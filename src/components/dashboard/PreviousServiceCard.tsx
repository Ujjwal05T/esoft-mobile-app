import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export interface PreviousServiceCardProps {
  visitDate: string;
  jobCategories: string[];
  selected?: boolean;
}

export default function PreviousServiceCard({
  visitDate,
  jobCategories,
  selected = false,
}: PreviousServiceCardProps) {
  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Text style={styles.date}>{visitDate}</Text>
      <View style={styles.badges}>
        {jobCategories.map((cat, i) => (
          <View key={i} style={styles.badge}>
            <Text style={styles.badgeText}>{cat}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#e5383b',
    backgroundColor: '#ffffff',
  },
  date: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e5383b',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#2b2b2b',
  },
});
