import React, {useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, Image, StyleSheet, View} from 'react-native';



interface SplashScreenProps {
  /** Duration in milliseconds before the splash screen fades out */
  duration?: number;
  /** Callback when splash screen finishes */
  onFinish?: () => void;
  /** Whether to show the splash screen */
  isVisible?: boolean;
}

const {width, height} = Dimensions.get('window');

const SplashScreen: React.FC<SplashScreenProps> = ({
  duration = 2500,
  onFinish,
  isVisible = true,
}) => {
  const [isShowing, setIsShowing] = useState(isVisible);
  
  // Animated values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!isVisible) {
      setIsShowing(false);
      return;
    }

    setIsShowing(true);
    
    // Reset animations
    containerOpacity.setValue(1);
    logoOpacity.setValue(0);
    logoScale.setValue(0.9);

    // Show logo with fade and scale animation after a brief delay
    const logoTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Start fading out the container before duration ends
    const fadeTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setIsShowing(false);
        onFinish?.();
      });
    }, duration - 600);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(fadeTimer);
    };
  }, [duration, isVisible, onFinish, containerOpacity, logoOpacity, logoScale]);

  if (!isShowing) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, {opacity: containerOpacity}]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{scale: logoScale}],
          },
        ]}>
          <Image 
            source={require('../assets/logos/parts_now.png')}
            style={{width: 186, height: 36}}
          />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreen;
