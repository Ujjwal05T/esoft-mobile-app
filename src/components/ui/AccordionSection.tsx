import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';

const ChevronIcon: React.FC<{isOpen: boolean}> = ({isOpen}) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View style={{transform: [{rotate}]}}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 9L12 15L18 9"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
};

export interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  headerBgColor?: string;
  headerTextColor?: string;
}

export default function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
  headerBgColor = '#e5383b',
  headerTextColor = '#ffffff',
}: AccordionSectionProps) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={[styles.header, {backgroundColor: headerBgColor}]}>
        <Text style={[styles.headerText, {color: headerTextColor}]}>
          {title}
        </Text>
        <ChevronIcon isOpen={isOpen} />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  header: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontWeight: '500',
    fontSize: 15,
  },
  content: {
    paddingTop: 16,
    gap: 16,
  },
});
