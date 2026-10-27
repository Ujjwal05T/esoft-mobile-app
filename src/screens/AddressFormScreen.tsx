import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation/CatalogStack';
import RedHeader from '../components/catalog/RedHeader';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import AppAlert from '../components/overlays/AppAlert';
import {
  createAddress,
  updateAddress,
  type SaveWorkshopAddress,
} from '../services/api';

type Route = NativeStackScreenProps<
  CatalogStackParamList,
  'AddressForm'
>['route'];

type FieldKey =
  | 'contactName'
  | 'phone'
  | 'addressLine'
  | 'city'
  | 'state'
  | 'pinCode';

const NAME_RULE = /^[\p{L}][\p{L} .'-]*$/u;
const PLACE_RULE = /^[\p{L}][\p{L} .'()-]*$/u;
const PHONE_RULE = /^[6-9]\d{9}$/;
const PIN_RULE = /^[1-9]\d{5}$/;

// Saved numbers may carry a +91 or 0 prefix; reduce them to the 10-digit mobile number
const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

function validate(v: Record<FieldKey, string>) {
  const errors: Partial<Record<FieldKey, string>> = {};
  const name = v.contactName.trim();
  if (!name) errors.contactName = 'Enter the contact name.';
  else if (name.length < 2 || !NAME_RULE.test(name)) {
    errors.contactName = 'Enter a valid name (letters only).';
  }
  if (!v.phone) errors.phone = 'Enter the phone number.';
  else if (!PHONE_RULE.test(v.phone)) {
    errors.phone = 'Enter a valid 10-digit mobile number.';
  }
  const address = v.addressLine.trim();
  if (!address) errors.addressLine = 'Enter the address.';
  else if (address.length < 5) errors.addressLine = 'Address is too short.';
  for (const key of ['city', 'state'] as const) {
    const text = v[key].trim();
    const label = key === 'city' ? 'city' : 'state';
    if (!text) errors[key] = `Enter the ${label}.`;
    else if (text.length < 2 || !PLACE_RULE.test(text)) {
      errors[key] = `Enter a valid ${label} (letters only).`;
    }
  }
  if (!v.pinCode) errors.pinCode = 'Enter the PIN code.';
  else if (!PIN_RULE.test(v.pinCode)) {
    errors.pinCode = 'PIN code must be 6 digits and cannot start with 0.';
  }
  return errors;
}

function Field({
  label,
  value,
  onChangeText,
  error,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#9ca3af"
        style={[styles.input, !!error && styles.inputError]}
        {...rest}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export default function AddressFormScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const { params } = useRoute<Route>();
  const existing = params?.address;
  const tabBarHeight = useTabBarHeight();

  const [label, setLabel] = useState(existing?.label ?? '');
  const [contactName, setContactName] = useState(existing?.contactName ?? '');
  const [phone, setPhone] = useState(normalizePhone(existing?.phone ?? ''));
  const [addressLine, setAddressLine] = useState(existing?.addressLine ?? '');
  const [landmark, setLandmark] = useState(existing?.landmark ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [state, setState] = useState(existing?.state ?? '');
  const [pinCode, setPinCode] = useState(existing?.pinCode ?? '');
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Errors show once a field was left, or for every field after a save attempt
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>(
    {},
  );
  const [submitted, setSubmitted] = useState(false);

  const errors = validate({
    contactName,
    phone,
    addressLine,
    city,
    state,
    pinCode,
  });
  const errorFor = (key: FieldKey) =>
    submitted || touched[key] ? errors[key] : undefined;
  const touch = (key: FieldKey) => () =>
    setTouched(prev => ({ ...prev, [key]: true }));

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    const body: SaveWorkshopAddress = {
      label: label.trim() || undefined,
      contactName: contactName.trim(),
      phone: phone.trim(),
      addressLine: addressLine.trim(),
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      isDefault,
    };

    setSaving(true);
    const res = existing
      ? await updateAddress(existing.id, body)
      : await createAddress(body);
    setSaving(false);
    if (res.success) navigation.goBack();
    else setMessage(res.error ?? 'Could not save the address.');
  };

  return (
    <View style={styles.container}>
      <RedHeader
        title={existing ? 'Edit Address' : 'Add Address'}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: tabBarHeight + 24 },
          ]}
        >
          <Field
            label="Label (optional)"
            value={label}
            onChangeText={setLabel}
            placeholder="Workshop, Branch 2…"
            maxLength={50}
          />
          <Field
            label="Contact name *"
            value={contactName}
            onChangeText={setContactName}
            onBlur={touch('contactName')}
            error={errorFor('contactName')}
            autoCapitalize="words"
            maxLength={150}
          />
          <Field
            label="Phone *"
            value={phone}
            onChangeText={v => setPhone(v.replace(/\D/g, ''))}
            onBlur={touch('phone')}
            error={errorFor('phone')}
            keyboardType="number-pad"
            placeholder="10-digit mobile number"
            maxLength={10}
          />
          <Field
            label="Address *"
            value={addressLine}
            onChangeText={setAddressLine}
            onBlur={touch('addressLine')}
            error={errorFor('addressLine')}
            placeholder="House / building, street, area"
            multiline
            maxLength={300}
          />
          <Field
            label="Landmark (optional)"
            value={landmark}
            onChangeText={setLandmark}
            maxLength={150}
          />
          <Field
            label="City *"
            value={city}
            onChangeText={setCity}
            onBlur={touch('city')}
            error={errorFor('city')}
            autoCapitalize="words"
            maxLength={100}
          />
          <Field
            label="State *"
            value={state}
            onChangeText={setState}
            onBlur={touch('state')}
            error={errorFor('state')}
            autoCapitalize="words"
            maxLength={100}
          />
          <Field
            label="PIN code *"
            value={pinCode}
            onChangeText={v => setPinCode(v.replace(/\D/g, ''))}
            onBlur={touch('pinCode')}
            error={errorFor('pinCode')}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={styles.defaultRow}
            activeOpacity={0.7}
            // The current default can't be unset here: mark another address instead
            disabled={existing?.isDefault}
            onPress={() => setIsDefault(v => !v)}
          >
            <View style={[styles.check, isDefault && styles.checkOn]}>
              {isDefault && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.defaultLabel}>Use as default address</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnBusy]}
            activeOpacity={0.85}
            disabled={saving}
            onPress={save}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveText}>Save Address</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppAlert
        isOpen={!!message}
        type="info"
        message={message ?? ''}
        onClose={() => setMessage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  flex: { flex: 1 },
  content: { padding: 16, gap: 12 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#161a1d',
  },
  inputError: { borderColor: '#e5383b' },
  errorText: { fontSize: 12, color: '#e5383b' },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: '#e5383b', borderColor: '#e5383b' },
  checkMark: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  defaultLabel: { fontSize: 14, color: '#161a1d' },
  saveBtn: {
    height: 46,
    borderRadius: 4,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnBusy: { opacity: 0.7 },
  saveText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
