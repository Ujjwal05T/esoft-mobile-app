import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Matches the custom tab bar in TabNavigator (it floats over screen content).
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Keep this bottom padding in sync with TabNavigator's own tab bar padding.
  return (width >= 600 ? 96 : 82) + Math.max(insets.bottom - 12, 6);
}
