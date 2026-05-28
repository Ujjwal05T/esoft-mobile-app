import {Alert, Linking, Platform, PermissionsAndroid} from 'react-native';
import {
  launchCamera,
  type CameraOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';

// ── Helpers ───────────────────────────────────────────────────────────────────

function promptOpenSettings() {
  Alert.alert(
    'Camera Permission Required',
    'Camera access is blocked. Please enable it in your device Settings to take photos.',
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Open Settings', onPress: () => Linking.openSettings()},
    ],
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for `launchCamera` that handles permission checks first.
 *
 * Android:
 *  - Not yet asked  → requests CAMERA permission, then launches if granted.
 *  - Permanently denied (never_ask_again) → shows alert to open Settings.
 *
 * iOS:
 *  - react-native-image-picker requests the permission automatically on the
 *    first launch. If the user has permanently denied it, the picker returns
 *    errorCode 'permission' → shows alert to open Settings.
 */
export async function launchCameraWithPermission(
  options: CameraOptions,
  callback: (response: ImagePickerResponse) => void,
): Promise<void> {
  if (Platform.OS === 'android') {
    const already = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );

    if (!already) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs camera access to take photos.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        launchCamera(options, callback);
      } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        promptOpenSettings();
      }
      // result === 'denied' → user tapped Deny this time; do nothing silently
      return;
    }
  }

  // Android: already granted, OR iOS: let image-picker handle initial prompt
  launchCamera(options, response => {
    if (response.errorCode === 'permission') {
      promptOpenSettings();
      return;
    }
    callback(response);
  });
}
