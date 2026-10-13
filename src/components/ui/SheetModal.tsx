import React, {useEffect, useState} from 'react';
import {Keyboard, Modal, ModalProps, Platform, StyleSheet, View} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';

// Drop-in replacement for <Modal> for bottom-sheet overlays.
//
// On Android a Modal is its own window that stops above the system navigation bar, which leaves
// an empty band under the sheet (iOS has no such band). Here the window is extended under the
// system bars, the sheet's own layout is kept inside the safe area exactly where it was, and the
// strip under the navigation bar is filled white so the sheet visually reaches the screen edge.
// iOS and non-Android platforms render a plain Modal.

// Flip to false to go back to the stock Android behaviour.
const EXTEND_UNDER_NAV_BAR = true;

const SHEET_FILL = '#ffffff';

interface Insets {
  top: number;
  bottom: number;
}

// Lives in its own SafeAreaProvider so it measures *this* window without changing what the
// sheet's own useSafeAreaInsets() calls return.
function InsetProbe({onChange}: {onChange: (insets: Insets) => void}) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    onChange({top: insets.top, bottom: insets.bottom});
  }, [insets.top, insets.bottom, onChange]);
  return null;
}

export default function SheetModal({children, ...props}: ModalProps) {
  const [insets, setInsets] = useState<Insets>({top: 0, bottom: 0});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const enabled = Platform.OS === 'android' && EXTEND_UNDER_NAV_BAR;

  useEffect(() => {
    if (!enabled) return;
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled]);

  if (!enabled) {
    return <Modal {...props}>{children}</Modal>;
  }

  // With the keyboard open the window already ends above it, so no navigation-bar strip is needed
  const bottom = keyboardVisible ? 0 : insets.bottom;

  return (
    <Modal statusBarTranslucent navigationBarTranslucent {...props}>
      <SafeAreaProvider style={StyleSheet.absoluteFill} pointerEvents="none">
        <InsetProbe onChange={setInsets} />
      </SafeAreaProvider>
      <View style={[styles.content, {top: insets.top, bottom}]}>{children}</View>
      {bottom > 0 && <View pointerEvents="none" style={[styles.strip, {height: bottom}]} />}
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {position: 'absolute', left: 0, right: 0},
  strip: {position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: SHEET_FILL},
});
