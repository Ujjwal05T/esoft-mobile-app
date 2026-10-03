import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType} from 'react-native';
import {useTranslation} from 'react-i18next';
import Lumax from '../../assets/logos/lumax.svg';
import Wai from '../../assets/logos/volvoline-logo.png';
import Monroe from '../../assets/logos/monroe-logo.png';
import Smic from '../../assets/logos/smic-logo.png';
import Sofima from '../../assets/logos/sofima-logo.png';
import ArrowDiagonalIcon from '../../assets/icons/arrow-diagonal.svg';

interface AftermarketCatalogCardProps {
  title?: string;
  onPress?: () => void;
}

type SvgLogo = React.FC<{width?: number | string; height?: number | string}>;
type BrandSlot = {logo?: SvgLogo | ImageSourcePropType; label?: string};

const brandSlots: BrandSlot[] = [
  {logo: Lumax},
  {logo: Wai},
  {logo: Monroe},
  {logo: Smic},
  {logo: Sofima},
];

function BrandLogo({logo, label}: BrandSlot) {
  if (!logo) {
    return <Text style={styles.logoLabel}>{label}</Text>;
  }
  // PNG/JPG imports resolve to a numeric asset id (or {uri} object); SVG imports resolve to a component.
  // Sized as a % of the (flexible) logoBox, not a fixed pixel value, so it never
  // outgrows a box that's had to shrink to fit a narrower screen.
  if (typeof logo === 'number' || typeof logo === 'object') {
    return (
      <Image
        source={logo}
        style={styles.logoImage}
        resizeMode="contain"
      />
    );
  }
  const Svg = logo;
  return <Svg width="100%" height="100%" />;
}

export default function AftermarketCatalogCard({title, onPress}: AftermarketCatalogCardProps) {
  const {t} = useTranslation();
  const displayTitle = title ?? t('aftermarket.title');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <Text style={styles.title}>{displayTitle}</Text>

      <View style={styles.arrowContainer}>
        <ArrowDiagonalIcon width={32} height={32} />
      </View>

      <View style={styles.logosRow}>
        {brandSlots.map((slot, i) => (
          <View key={i} style={styles.logoBox}>
            <BrandLogo {...slot} />
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
    right: 50,
    fontWeight: '700',
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: -0.8,
    lineHeight: 26,
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
    // left+right (rather than a fixed-width row) define this row's width from
    // the card's own size, so it can never overflow a narrower screen.
    left: 18,
    right: 18,
    top: 90,
    flexDirection: 'row',
    gap: 7,
    zIndex: 1,
  },
  logoBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
