import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import TabNavigator from './TabNavigator';
import {useAuth} from '../context/AuthContext';
import {AIAssistantScreen, NotificationsScreen} from '../screens';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import StaffVehicleDetailScreen from '../screens/StaffVehicleDetailScreen';
import QuoteDetailScreen from '../screens/QuoteDetailScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentCallbackScreen from '../screens/PaymentCallbackScreen';
import StaffScreen from '../screens/StaffScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportsScreen from '../screens/ReportsScreen';
import FAQsScreen from '../screens/FAQsScreen';
import PoliciesScreen from '../screens/PoliciesScreen';
import TermsAndConditionsScreen from '../screens/TermsAndConditionsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import RefundPolicyScreen from '../screens/RefundPolicyScreen';
import StaffProfileScreen from '../screens/StaffProfileScreen';
import InquiryDetailScreen from '../screens/InquiryDetailScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  AIAssistant: undefined;
  Notifications: undefined;
  VehicleDetail: {vehicleId: number};
  StaffVehicleDetail: {vehicleId: number};
  InquiryDetail: {inquiryId: number};
  QuoteDetail: {quoteId: number};
  OrderDetail: {orderId: number};
  Payment: {quoteId: number; selectedItemIds: number[]};
  PaymentCallback: {
    status?: string;
    order_id?: string;
    payment_id?: string;
    reason?: string;
  };
  Staff: undefined;
  Profile: undefined;
  StaffProfile: undefined;
  Reports: undefined;
  FAQs: undefined;
  Policies: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
  RefundPolicy: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep link scheme: partsnow://
// Payment callback URL to give your PG: partsnow://payment/callback
const linking = {
  prefixes: ['partsnow://'],
  config: {
    screens: {
      PaymentCallback: 'payment/callback',
    },
  },
};

const RootNavigator: React.FC = () => {
  const {isAuth, authChecked} = useAuth();

  // Wait for Keychain check to finish before rendering.
  // The splash screen covers the UI during this time.
  if (!authChecked) {
    return null;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}>
        {isAuth ? (
          <>
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
              name="StaffVehicleDetail"
              component={StaffVehicleDetailScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="InquiryDetail"
              component={InquiryDetailScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="QuoteDetail"
              component={QuoteDetailScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="PaymentCallback"
              component={PaymentCallbackScreen}
              options={{animation: 'fade', headerShown: false}}
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
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="FAQs"
              component={FAQsScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="Policies"
              component={PoliciesScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="TermsAndConditions"
              component={TermsAndConditionsScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="RefundPolicy"
              component={RefundPolicyScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
            <Stack.Screen
              name="StaffProfile"
              component={StaffProfileScreen}
              options={{animation: 'slide_from_right', headerShown: false}}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
