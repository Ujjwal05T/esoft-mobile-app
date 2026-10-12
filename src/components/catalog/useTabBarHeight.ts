import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Matches the custom floating tab bar in TabNavigator (it floats over screen content,
// detached from the bottom edge, so scroll content needs to clear the bar itself
// PLUS the gap below it).
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  // Keep this in sync with TabNavigator's own wrapper/tabItem sizing.
  const barHeight = isTablet ? 70 : 62;
  const bottomGap = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12);
  return barHeight + bottomGap + 10;
}
