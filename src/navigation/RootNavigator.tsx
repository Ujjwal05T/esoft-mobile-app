import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import TabNavigator from './TabNavigator';
import {useAuth} from '../context/AuthContext';
import {AIAssistantScreen, NotificationsScreen} from '../screens';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import QuoteDetailScreen from '../screens/QuoteDetailScreen';
import PaymentScreen from '../screens/PaymentScreen';
import StaffScreen from '../screens/StaffScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  AIAssistant: undefined;
  Notifications: undefined;
  VehicleDetail: {vehicleId: number};
  QuoteDetail: {quoteId: number};
  Payment: {quoteId: number};
  Staff: undefined;
  Profile: undefined;
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
        <Stack.Screen
          name="AIAssistant"
          component={AIAssistantScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="VehicleDetail"
          component={VehicleDetailScreen}
          options={{animation: 'slide_from_right', headerShown: false}}
        />
        <Stack.Screen
          name="QuoteDetail"
          component={QuoteDetailScreen}
          options={{animation: 'slide_from_right', headerShown: false}}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{animation: 'slide_from_right', headerShown: false}}
        />
        <Stack.Screen
          name="Staff"
          component={StaffScreen}
          options={{animation: 'slide_from_right', headerShown: false}}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{animation: 'slide_from_right', headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
