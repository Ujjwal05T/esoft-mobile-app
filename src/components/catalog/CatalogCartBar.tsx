import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CartIcon from '../../assets/icons/cart.svg';
import { ChevronRight } from './icons';

interface CatalogCartBarProps {
  count: number;
  bottom: number;
  onPress: () => void;
}

// Floating "View cart · N items" pill shown above the tab bar once the cart
// has items (Blinkit-style), so adding a product gives instant, persistent
// feedback without leaving the Catalog screen.
export default function CatalogCartBar({
  count,
  bottom,
  onPress,
}: CatalogCartBarProps) {
  if (count <= 0) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.bar}
      >
        <View style={styles.iconBadge}>
          <CartIcon width={16} height={16} color="#e5383b" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.subtitle}>
            {count} {count === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.title}>View cart</Text>
        </View>
        <View style={styles.chevron}>
          <ChevronRight color="#ffffff" size={16} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e5383b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { marginLeft: 10 },
  subtitle: {
    color: '#ffe3e3',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 13,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 17,
  },
  chevron: { marginLeft: 10 },
});
