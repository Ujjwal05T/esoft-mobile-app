/**
 * Esoft Mobile App
 * React Native CLI with Tab Navigation
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {StatusBar, useColorScheme, View, StyleSheet, Alert} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
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

// Background message handler must be set outside of any component
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  await handleNotification(remoteMessage);
});

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [showSplash, setShowSplash] = useState(true);

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
            onFinish={() => setShowSplash(false)}
          />
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
