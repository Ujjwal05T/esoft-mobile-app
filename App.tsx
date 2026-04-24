/**
 * Esoft Mobile App
 * React Native CLI with Tab Navigation
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {StatusBar, useColorScheme, View, StyleSheet, Alert, Platform} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
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
import {checkAppVersion, VersionCheckResponse} from './src/services/api';

// Reads version from android/build.gradle (versionName) or ios/Info.plist (CFBundleShortVersionString)
const APP_VERSION = DeviceInfo.getVersion();
const UPDATE_DISMISSED_KEY = '@update_dismissed_at';
const REMIND_AGAIN_HOURS = 24;

// Background message handler must be set outside of any component
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  await handleNotification(remoteMessage);
});

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [showSplash, setShowSplash] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<VersionCheckResponse | null>(null);

  const handleSplashFinish = async () => {
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
    // Handle foreground notifications
    const unsubscribeForeground = onMessageReceived(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);

      // Save notification
      await handleNotification(remoteMessage);

      // Show alert for foreground notifications
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || '',
        );
      }
    });

    // Handle notification opened when app was in background
    const unsubscribeOpened = onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background:', remoteMessage);
      // Handle navigation based on notification data
      if (remoteMessage.data) {
        // Navigate to specific screen based on data
        // Example: navigation.navigate(remoteMessage.data.screen);
      }
    });

    // Check if app was opened from a quit state by notification
    getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage);
        // Handle navigation based on notification data
        if (remoteMessage.data) {
          // Navigate to specific screen based on data
        }
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar
          barStyle={showSplash ? 'light-content' : isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={showSplash ? '#E5383B' : isDarkMode ? '#1f2937' : '#f5f7fa'}
        />
        <View style={styles.container}>
          <RootNavigator />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
