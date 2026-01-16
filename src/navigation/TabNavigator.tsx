import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeScreen, VehicleScreen, InquiryScreen} from '../screens';
import {CustomTabBar, UserRole} from '../components';

export type MainTabParamList = {
  Home: undefined;
  Vehicle: undefined;
  Inquiry: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabNavigatorProps {
  role?: UserRole;
}

const TabNavigator: React.FC<TabNavigatorProps> = ({role = 'staff'}) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} role={role} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Vehicle" component={VehicleScreen} />
      <Tab.Screen name="Inquiry" component={InquiryScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
