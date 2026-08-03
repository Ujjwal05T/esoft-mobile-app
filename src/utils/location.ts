import {Alert, Linking} from 'react-native';
import * as Location from 'expo-location';

export interface ResolvedAddress {
  address: string;
  city: string;
  pinCode: string;
}

function promptOpenSettings() {
  Alert.alert(
    'Location Permission Required',
    'Location access is blocked. Please enable it in your device Settings to use this feature.',
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Open Settings', onPress: () => Linking.openSettings()},
    ],
  );
}

/**
 * Gets the device's current position and reverse-geocodes it using the
 * platform's native geocoder (CLGeocoder on iOS, Geocoder on Android via
 * expo-location) — no API key or external service required.
 * Returns null if permission is denied or location/address can't be resolved.
 */
export async function getCurrentAddress(): Promise<ResolvedAddress | null> {
  const {status, canAskAgain} = await Location.requestForegroundPermissionsAsync();

  if (status !== Location.PermissionStatus.GRANTED) {
    if (!canAskAgain) {
      promptOpenSettings();
    }
    return null;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const [result] = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });

  if (!result) return null;

  const addressLine = [result.streetNumber, result.street, result.district, result.subregion]
    .filter(Boolean)
    .join(', ');

  return {
    address: addressLine || result.name || '',
    city: result.city || result.subregion || '',
    pinCode: result.postalCode || '',
  };
}
