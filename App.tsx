/**
 * Esoft Mobile App
 * React Native CLI with Tab Navigation
 *
 * @format
 */

import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from './src/navigation';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <RootNavigator
        isAuthenticated={false} // Set to true to skip login
        userRole="staff" // Change to 'admin' or 'owner' to see different tab configurations
      />
    </SafeAreaProvider>
  );
}

export default App;
