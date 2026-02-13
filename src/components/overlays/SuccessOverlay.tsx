import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Modal, Animated} from 'react-native';
import Svg, {Path} from 'react-native-svg';

interface SuccessOverlayProps {
  isVisible: boolean;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

export default function SuccessOverlay({
  isVisible,
  message = 'Success!',
  duration = 2000,
  onClose,
}: SuccessOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(opacity, {toValue: 1, duration: 300, useNativeDriver: true}),
        Animated.spring(scale, {toValue: 1, friction: 5, useNativeDriver: true}),
      ]).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {toValue: 0, duration: 300, useNativeDriver: true}).start(() => {
          onClose?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, opacity, scale, onClose]);

  return (
    <Modal visible={isVisible} transparent animationType="none">
      <Animated.View style={[styles.container, {opacity}]}>
        <Animated.View style={[styles.iconBox, {transform: [{scale}]}]}>
          <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12l5 5L19 7"
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  message: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
