import crashlytics from '@react-native-firebase/crashlytics';
import { getModel, getSystemName, getSystemVersion, getVersion } from 'react-native-device-info';

// Attach device/app context once so every recorded error in Crashlytics can be
// grouped/filtered by device model and OS version (needed to tell apart, e.g.,
// a TLS/cipher-suite failure on old Android devices from a backend timeout).
//
// React Native Firebase disables Crashlytics collection by default in debug
// builds (to keep dev crashes out of the dashboard) — force it on explicitly,
// otherwise every log()/recordError() call below runs locally and is silently
// dropped instead of being queued for upload. See RNFBCrashlyticsInit in
// logcat: "isCrashlyticsCollectionEnabled final value: false" without this.
let deviceContextSet = false;
function ensureDeviceContext() {
  if (deviceContextSet) return;
  deviceContextSet = true;
  crashlytics().setCrashlyticsCollectionEnabled(true).catch(() => {});
  crashlytics()
    .setAttributes({
      deviceModel: getModel(),
      systemName: getSystemName(),
      systemVersion: getSystemVersion(),
      appVersion: getVersion(),
    })
    .catch(() => {});
}

// Records the real network error (name/message — e.g. SSLHandshakeException,
// SocketTimeoutException, a 429 from rate limiting) to Crashlytics as a
// non-fatal, instead of it being discarded behind a generic "Network error"
// message shown to the user.
export function logNetworkError(endpoint: string, method: string, error: unknown): void {
  ensureDeviceContext();

  const err = error instanceof Error ? error : new Error(String(error));
  const label = `NetworkError [${method} ${endpoint}]: ${err.name}: ${err.message}`;

  if (__DEV__) {
    console.error(label, error);
  }

  crashlytics().log(label);
  crashlytics().recordError(err, label);
}
