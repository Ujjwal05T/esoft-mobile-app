import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { setFcmToken } from './api';
import { saveNotification } from './notificationStorage';

const TAG = '[NOTIF]';

// Request notification permissions (iOS)
export async function requestNotificationPermission(): Promise<boolean> {
  console.log(`${TAG} requestNotificationPermission — platform: ${Platform.OS}, version: ${Platform.Version}`);
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    console.log(`${TAG} iOS permission result: ${authStatus} (enabled: ${enabled})`);
    return enabled;
  } else {
    if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
      console.log(`${TAG} Android 13+ — requesting POST_NOTIFICATIONS runtime permission`);
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      console.log(`${TAG} POST_NOTIFICATIONS result: ${granted}`);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    console.log(`${TAG} Android < 13 — no runtime permission needed`);
    return true;
  }
}

// Get FCM token
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    console.log(`${TAG} FCM token obtained: ${token?.slice(0, 20)}...`);
    return token;
  } catch (error) {
    console.error(`${TAG} getFCMToken ERROR:`, error);
    return null;
  }
}

// Register FCM token with backend
export async function registerFCMToken(): Promise<boolean> {
  console.log(`${TAG} registerFCMToken — start`);
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn(`${TAG} registerFCMToken — permission denied, aborting`);
      return false;
    }

    const token = await getFCMToken();
    if (!token) {
      console.warn(`${TAG} registerFCMToken — no token returned from Firebase`);
      return false;
    }

    console.log(`${TAG} registerFCMToken — sending token to backend`);
    const result = await setFcmToken(token, Platform.OS);
    console.log(`${TAG} registerFCMToken — backend response success: ${result.success}`);
    return result.success;
  } catch (error) {
    console.error(`${TAG} registerFCMToken ERROR:`, error);
    return false;
  }
}

// Handle foreground notifications
export function onMessageReceived(
  callback: (message: FirebaseMessagingTypes.RemoteMessage) => void,
) {
  return messaging().onMessage(callback);
}

// Handle background/quit state notifications
export function setBackgroundMessageHandler(
  handler: (message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>,
) {
  messaging().setBackgroundMessageHandler(handler);
}

// Handle notification opened app
export async function getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
  return messaging().getInitialNotification();
}

// Listen for notification tap when app is in background
export function onNotificationOpenedApp(
  callback: (message: FirebaseMessagingTypes.RemoteMessage) => void,
) {
  return messaging().onNotificationOpenedApp(callback);
}

// Listen for token refresh
export function onTokenRefresh(callback: (token: string) => void) {
  console.log(`${TAG} onTokenRefresh — listener registered`);
  return messaging().onTokenRefresh(token => {
    console.log(`${TAG} onTokenRefresh — new token received: ${token?.slice(0, 20)}...`);
    callback(token);
  });
}

// Unregister FCM token (on logout)
export async function unregisterFCMToken(): Promise<void> {
  try {
    await messaging().deleteToken();
    console.log('FCM token deleted');
  } catch (error) {
    console.error('Error deleting FCM token:', error);
  }
}

// Subscribe to topic
export async function subscribeToTopic(topic: string): Promise<void> {
  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
  }
}

// Unsubscribe from topic
export async function unsubscribeFromTopic(topic: string): Promise<void> {
  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`Unsubscribed from topic: ${topic}`);
  } catch (error) {
    console.error(`Error unsubscribing from topic ${topic}:`, error);
  }
}

// Get notification badge count (iOS only)
export async function getBadgeCount(): Promise<number> {
  if (Platform.OS === 'ios') {
    // Use native module to get badge count
    const badge = await messaging().getInitialNotification();
    return 0; // Firebase Messaging doesn't provide direct badge count API
  }
  return 0;
}

// Set notification badge count (iOS only)
export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'ios') {
    // Badge count management is handled through native iOS APIs
    // Consider using react-native-badge or similar library for cross-platform support
    console.log(`Badge count requested: ${count}`);
  }
}

// Handle and save notification
export async function handleNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
  console.log(`${TAG} handleNotification — messageId: ${remoteMessage.messageId}`);
  console.log(`${TAG} handleNotification — notification payload:`, JSON.stringify(remoteMessage.notification));
  console.log(`${TAG} handleNotification — data payload:`, JSON.stringify(remoteMessage.data));
  try {
    const notification = remoteMessage.notification;
    const data = remoteMessage.data;

    if (!notification) {
      console.warn(`${TAG} handleNotification — no notification object in message, skipping save`);
      return;
    }

    await saveNotification({
      title: notification.title || 'New Notification',
      body: notification.body || '',
      imageUrl: notification.android?.imageUrl || data?.imageUrl as string | undefined,
      data: data as any,
    });
    console.log(`${TAG} handleNotification — saved to storage OK`);
  } catch (error) {
    console.error(`${TAG} handleNotification ERROR:`, error);
  }
}
