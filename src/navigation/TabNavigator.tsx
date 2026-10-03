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
        styles.container,
        {paddingBottom: Math.max(insets.bottom - (Platform.OS === 'ios' ? 12 : 6), 6)},
      ]}>
      <View style={styles.row}>
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
                style={[
                  styles.tabItem,
                  isTablet && styles.tabItemTablet,
                  isFocused && styles.tabItemActive,
                ]}
                activeOpacity={0.8}>
                {Icon && (
                  <Icon
                    width={isTablet ? 24 : 18}
                    height={isTablet ? 24 : 18}
                    color={isFocused ? '#ffffff' : '#2b2b2b'}
                  />
                )}
                <Text
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
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#e8ebf2',
    paddingHorizontal: 10,
    paddingTop: 6,
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
  tabItemTablet: {
    height: 84,
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
  tabLabelTablet: {
    fontSize: 15,
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
