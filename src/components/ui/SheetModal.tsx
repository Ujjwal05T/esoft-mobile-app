import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Keyboard, Modal, ModalProps, Platform, StyleSheet, View} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';

// Drop-in replacement for <Modal> for bottom-sheet overlays.
//
// On Android a Modal is its own window that stops above the system navigation bar, which leaves
// an empty band under the sheet (iOS has no such band). Here the window is extended under the
// system bars, the sheet's own layout is kept inside the safe area exactly where it was, and the
// strip under the navigation bar is filled white so the sheet visually reaches the screen edge.
// iOS and non-Android platforms render a plain Modal.
//
// Keyboard: neither a window under the system bars (Android) nor an iOS Modal is resized when the
// keyboard opens, so the keyboard would cover the sheet. The sheet's container is therefore
// shortened by the keyboard height on both platforms, which lifts the sheet above the keyboard.

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // iOS follows the keyboard with an Animated value; LayoutAnimation crashes Fabric when the
  // sheet is unmounted while a keyboard event is still animating.
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const enabled = Platform.OS === 'android' && EXTEND_UNDER_NAV_BAR;
  const isIos = Platform.OS === 'ios';
  const visible = props.visible;

  useEffect(() => {
    // Android's window is only resized by the system when it is not extended under the bars
    if (!enabled && !isIos) return;
    // Every overlay keeps a SheetModal mounted, so only the one on screen follows the keyboard
    if (!visible) {
      keyboardOffset.setValue(0);
      setKeyboardHeight(0);
      return;
    }
    // iOS reports the keyboard before it animates, so the sheet can follow it
    const showEvent = isIos ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = isIos ? 'keyboardWillHide' : 'keyboardDidHide';
    const moveTo = (height: number, duration?: number) => {
      if (!isIos) {
        setKeyboardHeight(height);
        return;
      }
      Animated.timing(keyboardOffset, {
        toValue: height,
        duration: duration || 250,
        easing: Easing.bezier(0.17, 0.59, 0.4, 0.77),
        useNativeDriver: false,
      }).start();
    };
    const show = Keyboard.addListener(showEvent, e => moveTo(e.endCoordinates.height, e.duration));
    const hide = Keyboard.addListener(hideEvent, e => moveTo(0, e.duration));
    return () => {
      show.remove();
      hide.remove();
      keyboardOffset.stopAnimation();
    };
  }, [enabled, isIos, keyboardOffset, visible]);

  if (!enabled) {
    if (!isIos) {
      return <Modal {...props}>{children}</Modal>;
    }
    return (
      <Modal {...props}>
        <Animated.View style={[styles.content, {top: 0, bottom: keyboardOffset}]}>{children}</Animated.View>
      </Modal>
    );
  }

  // With the keyboard open the sheet ends at its top edge, so no navigation-bar strip is needed
  const bottom = keyboardHeight > 0 ? keyboardHeight : insets.bottom;

  return (
    <Modal statusBarTranslucent navigationBarTranslucent {...props}>
      <SafeAreaProvider style={StyleSheet.absoluteFill} pointerEvents="none">
        <InsetProbe onChange={setInsets} />
      </SafeAreaProvider>
      <View style={[styles.content, {top: insets.top, bottom}]}>{children}</View>
      {keyboardHeight === 0 && bottom > 0 && <View pointerEvents="none" style={[styles.strip, {height: bottom}]} />}
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {position: 'absolute', left: 0, right: 0},
  strip: {position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: SHEET_FILL},
});
