/**
 * Esoft Mobile App
 * React Native CLI with Tab Navigation
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {StatusBar, useColorScheme, View, StyleSheet, Platform} from 'react-native';
import {Asset} from 'expo-asset';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {I18nextProvider} from 'react-i18next';
import i18n from './src/i18n';
import {RootNavigator} from './src/navigation';
import {SplashScreen} from './src/components';
import {AuthProvider} from './src/context/AuthContext';
import {
  onMessageReceived,
  onNotificationOpenedApp,
  getInitialNotification,
  handleNotification,
} from './src/services/notificationService';
import DeviceInfo from 'react-native-device-info';
import AppUpdateModal from './src/components/overlays/AppUpdateModal';
import ToastHost from './src/components/ui/Toast';
import {checkAppVersion, VersionCheckResponse} from './src/services/api';

// Reads version from android/build.gradle (versionName) or ios/Info.plist (CFBundleShortVersionString)
const APP_VERSION = DeviceInfo.getVersion();
const UPDATE_DISMISSED_KEY = '@update_dismissed_at';
const REMIND_AGAIN_HOURS = 24;

// Background message handler must be set outside of any component
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[NOTIF] setBackgroundMessageHandler — received', remoteMessage.messageId);
  console.log('[NOTIF] setBackgroundMessageHandler — notification:', JSON.stringify(remoteMessage.notification));
  console.log('[NOTIF] setBackgroundMessageHandler — data:', JSON.stringify(remoteMessage.data));
  await handleNotification(remoteMessage);
  console.log('[NOTIF] setBackgroundMessageHandler — handleNotification done');
});

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [showSplash, setShowSplash] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<VersionCheckResponse | null>(null);

  const handleSplashFinish = async () => {
    try {
      await Asset.loadAsync([
        require('./src/assets/logos/parts_now.png'),
        require('./src/assets/images/car-silhouette.png'),
        require('./src/assets/images/car-suv.png'),
        require('./src/assets/images/default-car.png'),
        require('./src/assets/images/event-car.png'),
        require('./src/assets/images/oil-filter.png'),
        require('./src/assets/images/rc-card.png'),
        require('./src/assets/images/request-part.png'),
        require('./src/assets/images/twin-brothers.png'),
      ]);
    } catch (_) {}
    setShowSplash(false);
    await runVersionCheck();
  };

  const runVersionCheck = async () => {
    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const result = await checkAppVersion(platform, APP_VERSION);
      if (!result.success || !result.data || result.data.updateType === 'none') return;

      // For optional updates, respect the "remind later" 24h window
      if (result.data.updateType === 'optional') {
        const dismissedAt = await AsyncStorage.getItem(UPDATE_DISMISSED_KEY);
        if (dismissedAt) {
          const hoursSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
          if (hoursSince < REMIND_AGAIN_HOURS) return;
        }
      }

      setUpdateInfo(result.data);
    } catch {
      // Fail silently — never block the user due to a check error
    }
  };

  const handleDismissUpdate = async () => {
    await AsyncStorage.setItem(UPDATE_DISMISSED_KEY, Date.now().toString());
    setUpdateInfo(null);
  };

  useEffect(() => {
    // Create Android notification channel once
    notifee.createChannel({
      id: 'etna_default_channel',
      name: 'ETNA Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    }).then(() => {
      console.log('[NOTIF] createChannel — etna_default_channel created/verified');
    }).catch((err: any) => {
      console.error('[NOTIF] createChannel ERROR:', err);
    });

    // Handle foreground notifications
    console.log('[NOTIF] Registering onMessage (foreground) listener');
    const unsubscribeForeground = onMessageReceived(async remoteMessage => {
      console.log('[NOTIF] onMessage (foreground) — received', remoteMessage.messageId);
      console.log('[NOTIF] onMessage — notification:', JSON.stringify(remoteMessage.notification));
      console.log('[NOTIF] onMessage — data:', JSON.stringify(remoteMessage.data));

      await handleNotification(remoteMessage);

      if (remoteMessage.notification) {
        console.log('[NOTIF] onMessage — calling notifee.displayNotification');
        try {
          await notifee.displayNotification({
            title: remoteMessage.notification.title || 'Notification',
            body: remoteMessage.notification.body || '',
            data: remoteMessage.data,
            android: {
              channelId: 'etna_default_channel',
              smallIcon: 'ic_notification',
              importance: AndroidImportance.HIGH,
              pressAction: {id: 'default'},
            },
          });
          console.log('[NOTIF] onMessage — notifee.displayNotification OK');
        } catch (err) {
          console.error('[NOTIF] onMessage — notifee.displayNotification ERROR:', err);
        }
      } else {
        console.warn('[NOTIF] onMessage — no notification payload, skipping display');
      }
    });

    // Handle notification opened when app was in background
    console.log('[NOTIF] Registering onNotificationOpenedApp listener');
    const unsubscribeOpened = onNotificationOpenedApp(remoteMessage => {
      console.log('[NOTIF] onNotificationOpenedApp — tapped from background');
      console.log('[NOTIF] onNotificationOpenedApp — data:', JSON.stringify(remoteMessage.data));
    });

    // Check if app was opened from a quit state by notification
    getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('[NOTIF] getInitialNotification — app opened from quit state');
        console.log('[NOTIF] getInitialNotification — data:', JSON.stringify(remoteMessage.data));
      } else {
        console.log('[NOTIF] getInitialNotification — app was not opened from a notification');
      }
    }).catch((err: any) => {
      console.error('[NOTIF] getInitialNotification ERROR:', err);
    });

    return () => {
      console.log('[NOTIF] Cleaning up foreground + openedApp listeners');
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar
          barStyle={showSplash ? 'light-content' : isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={showSplash ? '#E5383B' : isDarkMode ? '#1f2937' : '#f5f7fa'}
        />
        <View style={styles.container}>
          <RootNavigator />
          <ToastHost />
          <SplashScreen
            isVisible={showSplash}
            duration={2500}
            onFinish={handleSplashFinish}
          />
          {updateInfo && updateInfo.updateType !== 'none' && (
            <AppUpdateModal
              visible
              updateType={updateInfo.updateType as 'optional' | 'forced'}
              latestVersion={updateInfo.latestVersion}
              storeUrl={updateInfo.storeUrl}
              releaseNotes={updateInfo.releaseNotes}
              onDismiss={handleDismissUpdate}
            />
          )}
        </View>
      </AuthProvider>
    </SafeAreaProvider>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
