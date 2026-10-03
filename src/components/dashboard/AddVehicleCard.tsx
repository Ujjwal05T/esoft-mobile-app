import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ArrowDiagonalIcon from '../../assets/icons/arrow-diagonal.svg';
import {useTranslation} from 'react-i18next';

interface AddVehicleCardProps {
  onPress?: () => void;
}


export default function AddVehicleCard({onPress}: AddVehicleCardProps) {
  const {t} = useTranslation();
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
        <Text style={styles.title}>{t('vehicle.add_new')}</Text>

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
    height: 130,
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
    // Anchored from the left (not the right) so its position doesn't shift
    // with the card's width — see AddVehicleCard note below.
    left: 60,
    top: -150,
    width: 600,
    height: 350,
  },
  title: {
    position: 'absolute',
    left: 11,
    top: 31,
    fontWeight: '900',
    fontSize: 27,
    color: '#ffffff',
    letterSpacing: -1.28,
    lineHeight: 36,
    width: 169,
  },
  arrowContainer: {
    position: 'absolute',
    right: 12,
    top: 53,
    width: 32,
    height: 32,
  },
});
