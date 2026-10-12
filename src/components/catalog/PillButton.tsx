import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from './icons';

interface PillButtonProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Same visual language as CatalogCartBar: a red pill with a white icon circle
// on the left, label (optionally two lines) in the middle, and a chevron on
// the right. Used for the primary CTAs on Part Detail, Place Order and Cart.
export default function PillButton({
  icon,
  label,
  subtitle,
  onPress,
  disabled,
  style,
}: PillButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.bar, disabled && styles.disabled, style]}
    >
      <View style={styles.iconBadge}>{icon}</View>
      <View style={styles.textWrap}>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.chevron}>
        <ChevronRight color="#ffffff" size={16} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e5383b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 14,
  },
  disabled: { opacity: 0.5 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, marginLeft: 12 },
  subtitle: {
    color: '#ffe3e3',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 13,
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  chevron: { marginLeft: 10 },
});
