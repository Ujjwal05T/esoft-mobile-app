import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import TataMotors from '../../assets/logos/tata-motors.svg';
import Toyota from '../../assets/logos/toyota.svg';
import Mahindra from '../../assets/logos/mahindra.svg';
import Lumax from '../../assets/logos/lumax.svg';
import VLogo from '../../assets/logos/v-logo.svg';
import TwoLogo from '../../assets/logos/two-logo.svg';
import ArrowPartsIcon from '../../assets/icons/arrow-parts.svg';

interface RaisePartsCardProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
}

const brandLogos = [TataMotors, Toyota, Mahindra, Lumax, VLogo, TwoLogo];

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
        <ArrowPartsIcon width={32} height={32} />
      </View>

      {/* Brand Logos */}
      <View style={styles.logosRow}>
        {brandLogos.map((Logo, i) => (
          <View key={i} style={styles.logoBox}>
            <Logo width={49} height={49} />
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
    width: 32,
    height: 32,
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
});
