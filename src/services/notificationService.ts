import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { setFcmToken } from './api';
import { saveNotification } from './notificationStorage';

// Request notification permissions (iOS)
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }

    return enabled;
  } else {
    // Android 13+ requires POST_NOTIFICATIONS permission
    if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // Android < 13 doesn't need runtime permission
  }
}

// Get FCM token
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Register FCM token with backend
export async function registerFCMToken(): Promise<boolean> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return false;
    }

    const token = await getFCMToken();
    if (!token) {
      console.log('No FCM token available');
      return false;
    }

    // Send token to backend
    const result = await setFcmToken(token, Platform.OS);
    return result.success;
  } catch (error) {
    console.error('Error registering FCM token:', error);
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
  return messaging().onTokenRefresh(callback);
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
  try {
    const notification = remoteMessage.notification;
    const data = remoteMessage.data;

    if (notification) {
      await saveNotification({
        title: notification.title || 'New Notification',
        body: notification.body || '',
        imageUrl: notification.android?.imageUrl || data?.imageUrl as string | undefined,
        data: data as any,
      });
    }
  } catch (error) {
    console.error('Error handling notification:', error);
  }
}
