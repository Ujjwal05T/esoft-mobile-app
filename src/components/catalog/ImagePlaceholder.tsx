import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Props = {
  style?: StyleProp<ViewStyle>;
  size?: number;
  label?: string | null;
};

// Neutral "no photo" illustration: a gear inside a framed picture.
export default function ImagePlaceholder({
  style,
  size = 96,
  label = 'No image available',
}: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
        <Rect
          x={8}
          y={14}
          width={80}
          height={68}
          rx={10}
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth={3}
        />
        <Path
          d="M8 66l22-20 16 14 12-10 30 24"
          stroke="#d1d5db"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx={68}
          cy={34}
          r={7}
          fill="#e5e7eb"
          stroke="#d1d5db"
          strokeWidth={3}
        />
      </Svg>
      {!!label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 8, fontSize: 12, color: '#9ca3af' },
});
