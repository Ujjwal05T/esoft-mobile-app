import React, { useEffect } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// One pulse shared by every skeleton on screen, so all the grey blocks breathe together.
// It runs only while at least one skeleton is mounted.
const pulse = new Animated.Value(0.5);
let users = 0;
let loop: Animated.CompositeAnimation | null = null;

function startPulse() {
  users += 1;
  if (users === 1) {
    loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
  }
}

function stopPulse() {
  users -= 1;
  if (users === 0) {
    loop?.stop();
    loop = null;
  }
}

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

// A grey block that pulses while content loads
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 6,
  style,
}: SkeletonProps) {
  useEffect(() => {
    startPulse();
    return stopPulse;
  }, []);
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, opacity: pulse },
        styles.block,
        style,
      ]}
    />
  );
}

// Same shape as PartProductCard
export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={undefined} style={styles.cardImage} radius={8} />
      <View style={styles.cardInfo}>
        <Skeleton width="45%" height={10} />
        <Skeleton width="90%" height={13} />
        <Skeleton width="60%" height={13} />
        <Skeleton width="40%" height={16} style={styles.cardPrice} />
      </View>
    </View>
  );
}

// Two-column grid of product cards, like the catalog list
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  const rows = Math.ceil(count / 2);
  return (
    <View style={styles.grid}>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={styles.gridRow}>
          <View style={styles.gridItem}>
            <ProductCardSkeleton />
          </View>
          <View style={styles.gridItem}>
            <ProductCardSkeleton />
          </View>
        </View>
      ))}
    </View>
  );
}

// A cart / order line: picture, two lines of text and a price
export function LineItemSkeleton() {
  return (
    <View style={styles.line}>
      <Skeleton width={64} height={64} radius={8} />
      <View style={styles.lineText}>
        <Skeleton width="85%" height={13} />
        <Skeleton width="50%" height={11} />
        <Skeleton width="30%" height={15} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: '#e5e7eb' },
  card: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 8,
  },
  cardImage: { width: '100%', aspectRatio: 1 },
  cardInfo: { marginTop: 10, gap: 8 },
  cardPrice: { marginTop: 4 },
  grid: { width: '100%', gap: 10 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { width: '48.5%' },
  line: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  lineText: { flex: 1, gap: 8, justifyContent: 'center' },
});
