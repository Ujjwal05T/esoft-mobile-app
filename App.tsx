/**
 * Esoft Mobile App
 * React Native CLI with Tab Navigation
 *
 * @format
 */

import React, {useState} from 'react';
import {StatusBar, useColorScheme, View, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from './src/navigation';
import {SplashScreen} from './src/components';
import {AuthProvider} from './src/context/AuthContext';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [showSplash, setShowSplash] = useState(true);

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
