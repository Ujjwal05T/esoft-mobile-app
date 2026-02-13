import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';

interface RaisePartsCardProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
}

const brandColors = [
  '#1a1a1a',
  '#eb0a1e',
  '#e31837',
  '#ffd700',
  '#0000ff',
  '#006400',
];

const brandInitials = ['T', 'T', 'M', 'L', 'V', 'T'];

const ArrowIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path
      d="M8 24L24 8M24 8H12M24 8V20"
      stroke="white"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function RaisePartsCard({
  text1 = 'Raise Parts',
  text2 = 'Inquiry',
  onPress,
}: RaisePartsCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.card}>
      {/* Title */}
      <Text style={styles.title}>
        {text1}
        {'\n'}
        {text2}
      </Text>

      {/* Arrow Icon */}
      <View style={styles.arrowContainer}>
        <ArrowIcon />
      </View>

      {/* Brand Logo Placeholders */}
      <View style={styles.logosRow}>
        {brandColors.map((color, i) => (
          <View key={i} style={styles.logoBox}>
            <View style={[styles.logoInner, {backgroundColor: color}]}>
              <Text style={styles.logoText}>{brandInitials[i]}</Text>
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 167,
    backgroundColor: '#e5383b',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  title: {
    position: 'absolute',
    left: 16,
    top: 11,
    fontWeight: '700',
    fontSize: 22,
    color: '#ffffff',
    letterSpacing: -0.88,
    lineHeight: 28,
    zIndex: 1,
  },
  arrowContainer: {
    position: 'absolute',
    right: 12,
    top: 11,
    zIndex: 1,
  },
  logosRow: {
    position: 'absolute',
    left: 18,
    top: 90,
    flexDirection: 'row',
    gap: 7,
    zIndex: 1,
  },
  logoBox: {
    width: 65,
    height: 65,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
