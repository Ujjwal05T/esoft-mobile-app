import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ChevronDown } from './icons';

interface VehicleSelectorProps {
  selected: string | null;
  onPress: () => void;
  placeholder?: string;
  // When given and a vehicle is selected, shows an ✕ that clears the selection
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function VehicleSelector({
  selected,
  onPress,
  placeholder = 'Select Vehicle',
  onClear,
  style,
}: VehicleSelectorProps) {
  const hasSelection = !!selected;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.field,
        hasSelection ? styles.fieldSelected : styles.fieldEmpty,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          hasSelection ? styles.textSelected : styles.textEmpty,
        ]}
      >
        {selected ?? placeholder}
      </Text>
      {hasSelection && onClear && (
        <TouchableOpacity
          accessibilityLabel="Clear vehicle"
          activeOpacity={0.7}
          hitSlop={10}
          onPress={onClear}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 6L18 18M18 6L6 18"
              stroke="#ffffff"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
      )}
      <ChevronDown color={hasSelection ? '#ffffff' : '#161a1d'} size={18} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 40,
    borderRadius: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldEmpty: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadada',
  },
  fieldSelected: { backgroundColor: '#e5383b' },
  text: { flex: 1, fontSize: 13, fontWeight: '500' },
  textEmpty: { color: '#161a1d' },
  textSelected: { color: '#ffffff' },
});
