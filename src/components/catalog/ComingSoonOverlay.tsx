import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTabBarHeight } from './useTabBarHeight';

const RED = '#e5383b';

// A little parts-box with a clock: "the catalog is being prepared"
const CatalogIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 8.5L12 4l9 4.5v7L12 20l-9-4.5v-7z"
      stroke={RED}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <Path d="M3 8.5L12 13l9-4.5M12 13v7" stroke={RED} strokeWidth={1.7} strokeLinejoin="round" />
    <Circle cx={18.5} cy={18.5} r={4.5} fill="#ffffff" stroke={RED} strokeWidth={1.7} />
    <Path d="M18.5 16.2v2.5l1.5 1" stroke={RED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={RED} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FEATURES = [
  'catalog.coming_soon_feature_filter',
  'catalog.coming_soon_feature_fit',
  'catalog.coming_soon_feature_order',
] as const;

// Full-screen, non-dismissible "Coming Soon" cover. It swallows every touch, has no
// close button and no tap-to-dismiss, and leaves the screen behind it visible only as
// a dimmed glimpse. It is a plain View (not a Modal), so the tab bar stays usable.
export default function ComingSoonOverlay() {
  const { t } = useTranslation();
  // The floating tab bar sits over the bottom of the screen, so centre the card in what's above it
  const tabBarHeight = useTabBarHeight();

  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, pulse]);

  const cardStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };
  const ringStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
  };

  return (
    <View
      style={styles.scrim}
      onStartShouldSetResponder={() => true}
      accessibilityViewIsModal
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          <LinearGradient
            colors={['#ff6b6e', RED, '#c1272d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* soft decorative circles */}
            <View style={[styles.deco, styles.decoA]} />
            <View style={[styles.deco, styles.decoB]} />
          </LinearGradient>

          <View style={styles.iconSlot}>
            <Animated.View style={[styles.ring, ringStyle]} />
            <View style={styles.iconBadge}>
              <CatalogIcon />
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>{t('catalog.coming_soon_badge')}</Text>
            </View>

            <Text style={styles.title}>{t('catalog.coming_soon_title')}</Text>
            <Text style={styles.message}>{t('catalog.coming_soon_message')}</Text>

            <View style={styles.features}>
              {FEATURES.map(key => (
                <View key={key} style={styles.featureRow}>
                  <View style={styles.featureCheck}>
                    <CheckIcon />
                  </View>
                  <Text style={styles.featureText}>{t(key)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.hint}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Rect x={3} y={3} width={18} height={18} rx={5} stroke="#5c6370" strokeWidth={1.8} />
                <Path d="M12 8v5M12 16.2v.1" stroke="#5c6370" strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.hintText}>{t('catalog.coming_soon_hint')}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
    backgroundColor: 'rgba(22,26,29,0.62)',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  hero: {
    height: 104,
    overflow: 'hidden',
  },
  deco: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  decoA: { width: 150, height: 150, top: -70, right: -30 },
  decoB: { width: 90, height: 90, bottom: -45, left: -20 },
  iconSlot: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    marginTop: -42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: RED,
  },
  iconBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#fdecec',
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: RED },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, color: RED },
  title: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#161a1d',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#5c6370',
    textAlign: 'center',
  },
  features: {
    alignSelf: 'stretch',
    marginTop: 18,
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f6f7f9',
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fdecec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#2b2f36' },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  hintText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#5c6370' },
});
