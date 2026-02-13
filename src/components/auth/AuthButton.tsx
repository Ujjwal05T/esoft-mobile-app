import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface AuthButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function AuthButton({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
}: AuthButtonProps) {
  const variantStyle = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: styles.outline,
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        variantStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#e5383b' : '#ffffff'}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'outline' && styles.outlineText,
            isDisabled && styles.disabledText,
          ]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: '#e5383b',
  },
  secondary: {
    backgroundColor: '#2294f2',
  },
  outline: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d4d9e3',
  },
  disabled: {
    backgroundColor: '#d4d9e3',
    borderColor: '#d4d9e3',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  outlineText: {
    color: '#2b2b2b',
  },
  disabledText: {
    color: '#99a2b6',
  },
});
