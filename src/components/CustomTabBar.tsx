import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

// Import SVG icons
import HomeIcon from '../assets/icons/home.svg';
import VehicleIcon from '../assets/icons/vehicle.svg';
import InquiryIcon from '../assets/icons/inquiry.svg';
import OrderIcon from '../assets/icons/order.svg';
import PlusIcon from '../assets/icons/plus.svg';

interface NavItem {
  label: string;
  routeName: string;
  Icon: React.FC<{width?: number; height?: number; fill?: string; color?: string}>;
}

export type UserRole = 'staff' | 'admin' | 'owner';

interface CustomTabBarProps extends BottomTabBarProps {
  role?: UserRole;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  role = 'staff',
}) => {
  const insets = useSafeAreaInsets();

  // Define navigation items based on role (matching Next.js pattern)
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        label: 'Home',
        routeName: 'Home',
        Icon: HomeIcon,
      },
      {
        label: 'Vehicle',
        routeName: 'Vehicle',
        Icon: VehicleIcon,
      },
    ];

    // Add Orders for admin/owner roles (3rd position)
    if (role === 'admin' || role === 'owner') {
      baseItems.push({
        label: 'Orders',
        routeName: 'Orders',
        Icon: OrderIcon,
      });
    }

    // Add Inquiry for all roles
    baseItems.push({
      label: 'Inquiry',
      routeName: 'Inquiry',
      Icon: InquiryIcon,
    });

    return baseItems;
  };

  const navItems = getNavItems();

  const handleFabPress = () => {
    // Handle FAB press - can be customized for different actions
    console.log('FAB pressed');
  };

  return (
    <View
      style={[
        styles.container,
        {paddingBottom: Math.max(insets.bottom, 8)},
      ]}>
      <View style={styles.tabBarContent}>
        {/* Tab Items */}
        <View style={styles.tabsWrapper}>
          {state.routes.map((route, index) => {
            const {options} = descriptors[route.key];
            const isFocused = state.index === index;

            const navItem = navItems.find(item => item.routeName === route.name);

            if (!navItem) {
              return null;
            }

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

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const IconComponent = navItem.Icon;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? {selected: true} : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={`tab-${route.name}`}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.tabItem,
                  isFocused && styles.tabItemActive,
                ]}>
                <View style={styles.tabItemContent}>
                  <IconComponent
                    width={18}
                    height={18}
                    color={isFocused ? '#ffffff' : '#1E1E1E'}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused && styles.tabLabelActive,
                    ]}>
                    {navItem.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fabContainer}
          onPress={handleFabPress}
          activeOpacity={0.8}>
          {/* Outer glow effect */}
          <View style={styles.fabGlow} />
          {/* Main red circle */}
          <View style={styles.fabBackground}>
            {/* Semi-transparent white inner circle overlay */}
            <View style={styles.fabInnerCircle} />
            {/* Plus icon */}
            <View style={styles.fab}>
              <PlusIcon width={22} height={22} color="#e5383b" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#e8ebf2',
    paddingHorizontal: 10,
    paddingTop: 6,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabsWrapper: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    maxWidth: 85,
    height: 70,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: '#e5383b',
  },
  tabItemContent: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 8,
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
    // position: 'absolute',
    // width: 100,
    // height: 100,
    // borderRadius: 50,
    // backgroundColor: 'rgba(229, 56, 59, 0.25)',
    // Blur effect simulation with shadow
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
  fab: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomTabBar;
