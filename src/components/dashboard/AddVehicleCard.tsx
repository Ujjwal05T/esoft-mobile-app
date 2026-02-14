import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ArrowDiagonalIcon from '../../assets/icons/arrow-diagonal.svg';

interface AddVehicleCardProps {
  onPress?: () => void;
}


export default function AddVehicleCard({onPress}: AddVehicleCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <LinearGradient
        colors={['#e5383b', '#bb282b']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.gradient}>
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
          <ArrowDiagonalIcon width={32} height={32} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 155,
    borderRadius: 9,
    width: '100%',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  carSilhouette: {
    position: 'absolute',
    right: -410,
    top: -165,
    width: 680,
    height: 395,
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
    width: 32,
    height: 32,
  },
});
