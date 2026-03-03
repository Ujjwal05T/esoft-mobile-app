import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';

interface NavigationOption {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface FloatingActionButtonProps {
  navigationOptions?: NavigationOption[];
  onPress?: () => void;
  style?: object;
}

export default function FloatingActionButton({
  navigationOptions = [],
  onPress,
  style,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.timing(rotation, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setIsOpen(v => !v);

    if (!isOpen && onPress) {
      onPress();
    }
  };

  const handleOptionPress = (option: NavigationOption) => {
    option.onPress();
    setIsOpen(false);
    Animated.timing(rotation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* Backdrop when open */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggle}
        />
      )}

      <View style={[styles.container, style]}>
        {/* Options Menu */}
        {isOpen && navigationOptions.length > 0 && (
          <View style={styles.options}>
            {navigationOptions.map((option, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => !option.disabled && handleOptionPress(option)}
                style={[styles.optionBtn, option.disabled && styles.optionBtnDisabled]}
                activeOpacity={option.disabled ? 1 : 0.7}>
                <Text style={[styles.optionText, option.disabled && styles.optionTextDisabled]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* FAB Button */}
        <TouchableOpacity
          onPress={toggle}
          style={styles.fab}
          activeOpacity={0.8}>
          <Animated.View style={{transform: [{rotate}]}}>
            <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
              <Path
                d="M16 8v16M8 16h16"
                stroke="white"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 30,
  },
  container: {
    position: 'absolute',
    right: 16,
    bottom: 130,
    alignItems: 'flex-end',
    zIndex: 40,
  },
  options: {
    marginBottom: 8,
    gap: 10,
    alignItems: 'flex-end',
  },
  optionBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  optionText: {
    fontWeight: '500',
    fontSize: 15,
    color: '#000000',
  },
  optionBtnDisabled: {
    backgroundColor: '#f5f5f5',
  },
  optionTextDisabled: {
    color: '#b0b0b0',
  },
  fab: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
