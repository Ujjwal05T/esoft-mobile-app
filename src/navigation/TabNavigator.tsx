import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {
  VehicleScreen,
  InquiryScreen,
  OwnerDashboardScreen,
  OrdersScreen,
} from '../screens';
import CatalogStack from './CatalogStack';
import HomeIcon from '../assets/icons/home.svg';
import VehicleIcon from '../assets/icons/vehicle.svg';
import OrderIcon from '../assets/icons/order.svg';
import InquiryIcon from '../assets/icons/inquiry.svg';
import CatalogIcon from '../assets/icons/catalog.svg';

export type MainTabParamList = {
  Home: undefined;
  Vehicle: undefined;
  Orders: undefined;
  Inquiry: {initialTab?: 'inquiries' | 'quotes' | 'disputes'} | undefined;
  Catalog: undefined;
};

type SvgIcon = React.FC<{width?: number; height?: number; color?: string}>;

const iconMap: Record<string, SvgIcon> = {
  Home: HomeIcon as unknown as SvgIcon,
  Vehicle: VehicleIcon as unknown as SvgIcon,
  Orders: OrderIcon as unknown as SvgIcon,
  Inquiry: InquiryIcon as unknown as SvgIcon,
  Catalog: CatalogIcon as unknown as SvgIcon,
};


function TabBar({state, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;
  const tabLabels: Record<string, string> = {
    Home: t('nav.home'),
    Vehicle: t('nav.vehicles'),
    Orders: t('nav.orders'),
    Inquiry: t('nav.inquiry'),
    Catalog: t('nav.catalog'),
  };

  return (
    <View
      style={[
        styles.wrapper,
        {bottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12)-10},
      ]}>
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
              style={styles.tabItem}
              activeOpacity={0.75}>
              <View
                style={[styles.iconWrap, isTablet && styles.iconWrapTablet]}>
                {Icon && (
                  <Icon
                    width={isTablet ? 22 : 18}
                    height={isTablet ? 22 : 18}
                    color={isFocused ? '#e5383b' : '#9aa0ae'}
                  />
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  isTablet && styles.tabLabelTablet,
                  isFocused && styles.tabLabelActive,
                ]}>
                {tabLabels[route.name] ?? route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{headerShown: false}}
      tabBar={props => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={OwnerDashboardScreen} />
      <Tab.Screen name="Vehicle" component={VehicleScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Inquiry" component={InquiryScreen} />
      <Tab.Screen name="Catalog" component={CatalogStack} />
    </Tab.Navigator>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#eef0f4',
    borderRadius: 32,
    overflow: 'hidden',
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#1a1a2e',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 14,
  },
  tabsRow: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  iconWrap: {
    width: 36,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapTablet: {
    width: 44,
    height: 36,
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#9aa0ae',
    textAlign: 'center',
  },
  tabLabelTablet: {
    fontSize: 13,
  },
  tabLabelActive: {
    color: '#e5383b',
    fontWeight: '700',
  },
});
