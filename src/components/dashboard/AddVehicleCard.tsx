import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ArrowDiagonalIcon from '../../assets/icons/arrow-diagonal.svg';
import {useTranslation} from 'react-i18next';

interface AddVehicleCardProps {
  onPress?: () => void;
}


export default function AddVehicleCard({onPress}: AddVehicleCardProps) {
  const {t} = useTranslation();
  const [cardWidth, setCardWidth] = useState(REF_WIDTH);
  // Scale the artwork with the card width so it stays between title and arrow.
  const scale = Math.min(1.3, Math.max(0.8, cardWidth / REF_WIDTH));
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.card}
      onLayout={e => setCardWidth(e.nativeEvent.layout.width)}>
      <LinearGradient
        colors={['#e5383b', '#bb282b']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.gradient}>
        {/* Background car silhouette */}
        <Image
          source={require('../../assets/images/car-silhouette.png')}
          style={[
            styles.carSilhouette,
            {
              left: 81 * scale,
              top: CAR_CENTER_Y - 0.626 * 298 * scale,
              width: 510 * scale,
              height: 298 * scale,
            },
          ]}
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

// Card width the artwork offsets below were tuned against.
const REF_WIDTH = 361;
const CAR_CENTER_Y = 69;

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
