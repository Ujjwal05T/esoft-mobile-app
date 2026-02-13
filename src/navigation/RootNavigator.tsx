import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import TabNavigator from './TabNavigator';
import {useAuth} from '../context/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const {isAuth, authChecked} = useAuth();

  // Wait for Keychain check to finish before rendering.
  // The splash screen covers the UI during this time.
  if (!authChecked) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
        initialRouteName={isAuth ? 'MainTabs' : 'Auth'}>
        <Stack.Screen name="Auth" component={AuthStack} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
