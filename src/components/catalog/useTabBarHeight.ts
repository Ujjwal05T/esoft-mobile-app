import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Android 3-button navigation reserves a full bar under the app (about 48dp), while gesture
// navigation only reserves a thin handle (about 24dp).
const BUTTON_NAV_MIN_INSET = 36;

// Distance from the bottom of the screen to the bottom of the floating tab bar.
export function getTabBarBottom(insetBottom: number) {
  if (Platform.OS === 'ios') return Math.max(insetBottom, 20) - 10;
  // The bar must sit above the navigation buttons rather than under them
  if (insetBottom >= BUTTON_NAV_MIN_INSET) return insetBottom + 8;
  return Math.max(insetBottom, 12) - 10;
}

// Matches the custom floating tab bar in TabNavigator (it floats over screen content,
// detached from the bottom edge, so scroll content needs to clear the bar itself
// PLUS the gap below it).
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  // Keep this in sync with TabNavigator's own wrapper/tabItem sizing.
  const barHeight = isTablet ? 70 : 62;
  return barHeight + getTabBarBottom(insets.bottom) + 20;
}

const FAB_BASE_BOTTOM = 130;

// Bottom offset for the floating "+" button. It sits at a fixed distance above the floating tab
// bar, so it rises by however much getTabBarBottom lifted the bar above its original position
// (nothing on iOS or with gesture navigation).
export function useFabBottom() {
  const insets = useSafeAreaInsets();
  const originalBarBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12) - 10;
  return FAB_BASE_BOTTOM + getTabBarBottom(insets.bottom) - originalBarBottom;
}
