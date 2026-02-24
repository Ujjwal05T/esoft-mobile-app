import React, {useState, useRef, useEffect} from 'react';
import {
  Animated,
  TextInput,
  View,
  StyleSheet,
  KeyboardTypeOptions,
  ViewStyle,
} from 'react-native';

interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
  editable?: boolean;
  multiline?: boolean;
  containerStyle?: ViewStyle;
  wrapperStyle?: ViewStyle;
  rightElement?: React.ReactNode;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChange,
  required,
  keyboardType = 'default',
  maxLength,
  autoFocus,
  secureTextEntry,
  editable = true,
  multiline = false,
  containerStyle,
  wrapperStyle,
  rightElement,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value.length > 0 ? 1 : 0)).current;

  const isActive = isFocused || value.length > 0;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isActive ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isActive, labelAnim]);

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [17, -8],
  });

  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const borderColor = isActive ? '#e5383b' : '#9ca3af';

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <View style={[styles.container, {borderColor}, multiline && styles.containerMultiline, containerStyle]}>
        <Animated.Text
          style={[styles.label, {top: labelTop, fontSize: labelFontSize}]}>
          {label}
          {required && value.length > 0 ? '*' : ''}
        </Animated.Text>
        <TextInput
          style={[styles.input, rightElement ? styles.inputWithRight : null, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoFocus={autoFocus}
          secureTextEntry={secureTextEntry}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholder=""
        />
        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
    marginBottom: 16,
  },
  container: {
    height: 56,
    borderWidth: 1,
    borderRadius: 4,
    position: 'relative',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  containerMultiline: {
    height: 108,
    justifyContent: 'flex-start',
  },
  label: {
    position: 'absolute',
    left: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    color: '#666666',
    zIndex: 1,
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    paddingTop: 10,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputMultiline: {
    height: 100,
    paddingTop: 16,
  },
  inputWithRight: {
    paddingRight: 80,
  },
  rightElement: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default FloatingInput;
