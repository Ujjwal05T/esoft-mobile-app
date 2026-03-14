import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  HomeScreen,
  VehicleScreen,
  StaffVehicleScreen,
  InquiryScreen,
  StaffInquiryScreen,
  OwnerDashboardScreen,
  OrdersScreen,
} from '../screens';
import {useAuth} from '../context/AuthContext';
import HomeIcon from '../assets/icons/home.svg';
import VehicleIcon from '../assets/icons/vehicle.svg';
import OrderIcon from '../assets/icons/order.svg';
import InquiryIcon from '../assets/icons/inquiry.svg';
import PlusIcon from '../assets/icons/plus.svg';

export type MainTabParamList = {
  Home: undefined;
  Vehicle: undefined;
  Orders: undefined;
  Inquiry: undefined;
};

type SvgIcon = React.FC<{width?: number; height?: number; color?: string}>;

const iconMap: Record<string, SvgIcon> = {
  Home: HomeIcon as unknown as SvgIcon,
  Vehicle: VehicleIcon as unknown as SvgIcon,
  Orders: OrderIcon as unknown as SvgIcon,
  Inquiry: InquiryIcon as unknown as SvgIcon,
};


function TabBar({state, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom + 6}]}>
      <View style={styles.row}>
        {/* Tabs — flex: 1 so they fill all space except the FAB */}
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const Icon = iconMap[route.name];

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={[styles.tabItem, isFocused && styles.tabItemActive]}
                activeOpacity={0.8}>
                {Icon && (
                  <Icon
                    width={18}
                    height={18}
                    color={isFocused ? '#ffffff' : '#2b2b2b'}
                  />
                )}
                <Text
                  style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {route.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FAB - AI Assistant */}
        <TouchableOpacity
          style={styles.fabContainer}
          activeOpacity={0.8}
          onPress={() => navigation.getParent()?.navigate('AIAssistant' as never)}>
          <View style={styles.fabGlow} />
          <View style={styles.fabBackground}>
            <View style={styles.fabInnerCircle} />
            <View style={styles.fabIcon}>
              <PlusIcon width={22} height={22} color="#e5383b" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator: React.FC = () => {
  const {userRole} = useAuth();
  const HomeComponent =
    userRole === 'owner' ? OwnerDashboardScreen : HomeScreen;
  const VehicleComponent =
    userRole === 'owner' || userRole === 'admin' ? VehicleScreen : StaffVehicleScreen;
  const InquiryComponent =
    userRole === 'owner' || userRole === 'admin' ? InquiryScreen : StaffInquiryScreen;
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';

  return (
    <Tab.Navigator
      screenOptions={{headerShown: false}}
      tabBar={props => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeComponent} />
      <Tab.Screen name="Vehicle" component={VehicleComponent} />
      {isAdminOrOwner && (
        <Tab.Screen name="Orders" component={OrdersScreen} />
      )}
      <Tab.Screen name="Inquiry" component={InquiryComponent} />
    </Tab.Navigator>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#e8ebf2',
    paddingHorizontal: 10,
    paddingTop: 6,
    maxWidth: 520, // Slightly increased for better spacing
    alignSelf: 'center',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  tabItem: {
    flex: 1,
    height: 70,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  tabItemActive: {
    backgroundColor: '#e5383b',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#2b2b2b',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  fabContainer: {
    position: 'relative',
    marginLeft: 8,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabGlow: {
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 0,
  },
  fabBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  fabInnerCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fabIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
