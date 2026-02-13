import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Svg, {Path} from 'react-native-svg';

interface AddVehicleCardProps {
  onPress?: () => void;
}

const ArrowDiagonalIcon = () => (
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

export default function AddVehicleCard({onPress}: AddVehicleCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.card}>
      {/* Background car silhouette */}
      <Image
        source={require('../../assets/images/car-silhouette.png')}
        style={styles.carSilhouette}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Add a New{'\n'}Vehicle</Text>

      {/* Arrow Icon */}
      <View style={styles.arrowContainer}>
        <ArrowDiagonalIcon />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 155,
    borderRadius: 9,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#e5383b',
    position: 'relative',
  },
  carSilhouette: {
    position: 'absolute',
    right: -20,
    top: -10,
    width: 280,
    height: 185,
  },
  title: {
    position: 'absolute',
    left: 11,
    top: 21,
    fontWeight: '900',
    fontSize: 30,
    color: '#ffffff',
    letterSpacing: -1.28,
    lineHeight: 36,
    width: 169,
  },
  arrowContainer: {
    position: 'absolute',
    left: 11,
    top: 103,
  },
});
