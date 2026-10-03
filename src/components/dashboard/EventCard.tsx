import React from 'react';
import {View, Text, StyleSheet, ImageBackground, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ArrowDiagonalIcon from '../../assets/icons/arrow-diagonal.svg';
import TwoLogo from '../../assets/logos/two-logo.svg';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DEFAULT_IMAGE = require('../../assets/images/valvoline-card-image.png') as number;

interface EventCardProps {
  title?: string;
  date?: string;
  time?: string;
  venue?: string;
  imageSrc?: number;
  onPress?: () => void;
}

export default function EventCard({
  title = 'Valvoline Mechanic Meet',
  date,
  time,
  venue,
  imageSrc = DEFAULT_IMAGE,
  onPress,
}: EventCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const hasDetails = date || time || venue;

  return (
    <Wrapper onPress={onPress} activeOpacity={0.85}>
      <ImageBackground
        source={imageSrc}
        style={styles.card}
        imageStyle={styles.image}
        resizeMode="cover">
        {/* Brightness boost */}
        <View style={styles.brightnessTint} />

        <View style={styles.logoContainer}>
          <TwoLogo width={50} height={32} />
        </View>

        <View style={styles.arrowContainer}>
          <ArrowDiagonalIcon width={32} height={32} />
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(229,56,59,0.35)', 'rgba(229,56,59,0.85)']}
          locations={[0, 0.55, 1]}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.gradient}>
          <View style={styles.contentOverlay}>
            <Text style={styles.title}>{title}</Text>
            {hasDetails && (
              <Text style={styles.details}>
                {[date, time, venue].filter(Boolean).join(' • ')}
              </Text>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 16,
  },
  fallbackBg: {
    backgroundColor: '#e5383b',
    justifyContent: 'flex-end',
  },
  brightnessTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0)',
  },
  arrowContainer: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 32,
    height: 32,
    zIndex: 999,
  },
  logoContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 50,
    height: 32,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentOverlay: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  details: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 17,
  },
});
