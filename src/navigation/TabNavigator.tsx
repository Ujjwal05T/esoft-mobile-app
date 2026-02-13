import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeScreen, VehicleScreen, InquiryScreen, OwnerDashboardScreen} from '../screens';
import {CustomTabBar} from '../components';
import {useAuth} from '../context/AuthContext';

export type MainTabParamList = {
  Home: undefined;
  Vehicle: undefined;
  Inquiry: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator: React.FC = () => {
  const {userRole} = useAuth();
  const HomeComponent = userRole === 'owner' ? OwnerDashboardScreen : HomeScreen;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} role={userRole} />}>
      <Tab.Screen name="Home" component={HomeComponent} />
      <Tab.Screen name="Vehicle" component={VehicleScreen} />
      <Tab.Screen name="Inquiry" component={InquiryScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
