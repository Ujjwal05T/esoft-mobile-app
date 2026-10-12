import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const ClockIcon = () => (
  <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#e5383b" strokeWidth={1.8} />
    <Path
      d="M12 7V12L15 14"
      stroke="#e5383b"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Full-screen, non-dismissible "Coming Soon" cover. It swallows every touch, has no
// close button and no tap-to-dismiss, and leaves the screen behind it visible only as
// a dimmed glimpse. It is a plain View (not a Modal), so the tab bar stays usable.
export default function ComingSoonOverlay({
  title = 'Catalog',
}: {
  title?: string;
}) {
  return (
    <View
      style={styles.scrim}
      onStartShouldSetResponder={() => true}
      accessibilityViewIsModal
    >
      <View style={styles.card}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>COMING SOON</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <ClockIcon />
          </View>
          <Text style={styles.title}>{title} is on its way</Text>
          <Text style={styles.message}>
            We're getting the parts catalog ready for you. Check back soon.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
    backgroundColor: 'rgba(22,26,29,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  banner: {
    backgroundColor: '#e5383b',
    paddingVertical: 10,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#ffffff',
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fdecec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#161a1d',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#5c6370',
    textAlign: 'center',
  },
});
