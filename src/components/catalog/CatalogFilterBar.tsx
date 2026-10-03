import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { ChevronDown, SlidersIcon } from './icons';

interface CatalogFilterBarProps {
  appliedCount: number;
  onOpenFilters: () => void;
  onClear: () => void;
  dropdowns?: string[];
  onPressDropdown?: (label: string) => void;
  activeDropdowns?: string[];
}

export default function CatalogFilterBar({
  appliedCount,
  onOpenFilters,
  onClear,
  dropdowns = ['Sort', 'Brands', 'Oil Grade'],
  onPressDropdown,
  activeDropdowns = [],
}: CatalogFilterBarProps) {
  const active = appliedCount > 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <View style={[styles.chip, active && styles.chipActive]}>
        <TouchableOpacity
          style={styles.chipInner}
          activeOpacity={0.7}
          onPress={onOpenFilters}
        >
          <SlidersIcon color={active ? '#e5383b' : '#161a1d'} />
          <Text style={[styles.chipText, active && styles.chipTextActive]}>
            {active ? `Filters (${appliedCount})` : 'Filters'}
          </Text>
        </TouchableOpacity>
        {active && (
          <TouchableOpacity activeOpacity={0.7} onPress={onClear}>
            <Text style={[styles.chipText, styles.chipTextActive]}>
              · Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {dropdowns.map(label => {
        const isActive = activeDropdowns.includes(label);
        return (
          <TouchableOpacity
            key={label}
            style={[styles.chip, isActive && styles.chipActive]}
            activeOpacity={0.7}
            onPress={() => onPressDropdown?.(label)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {label}
            </Text>
            <ChevronDown color={isActive ? '#e5383b' : '#161a1d'} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    height: 34,
    borderWidth: 1,
    borderColor: '#dadada',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
  },
  chipInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActive: { borderColor: '#e5383b', backgroundColor: '#fff5f5' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#161a1d' },
  chipTextActive: { color: '#e5383b' },
});
