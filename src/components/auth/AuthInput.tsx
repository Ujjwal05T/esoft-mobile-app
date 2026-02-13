import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';

interface AuthInputProps {
  label: string;
  keyboardType?: KeyboardTypeOptions;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  icon?: React.ReactNode;
}

export default function AuthInput({
  label,
  keyboardType = 'default',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  secureTextEntry,
  icon,
}: AuthInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.asterisk}> *</Text>}
      </Text>
      <View style={[styles.inputContainer, error ? styles.inputError : styles.inputDefault]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          placeholderTextColor="#99a2b6"
          style={[styles.input, icon ? styles.inputWithIcon : null]}
        />
      </View>
      {!!error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2b2b2b',
    marginBottom: 8,
  },
  asterisk: {
    color: '#e5383b',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputDefault: {
    borderColor: '#d4d9e3',
  },
  inputError: {
    borderColor: '#e5383b',
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#2b2b2b',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#e5383b',
    marginTop: 4,
  },
});
