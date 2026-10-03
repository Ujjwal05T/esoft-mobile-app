import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export const ChevronDown = ({
  color = '#161a1d',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9L12 15L18 9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SlidersIcon = ({
  color = '#161a1d',
  size = 14,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6H10M14 6H20M4 12H6M10 12H20M4 18H14M18 18H20M10 4V8M6 10V14M14 16V20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const CloseCircleIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#161a1d" strokeWidth={1.5} />
    <Path
      d="M15 9L9 15M9 9L15 15"
      stroke="#161a1d"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);
