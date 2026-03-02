import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import MobileSidebar from '../layout/MobileSidebar';
import {subscribeToUnreadCount} from '../../services/notificationStorage';

interface HeaderProps {
  onNotificationPress?: () => void;
}

export default function Header({onNotificationPress}: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToUnreadCount(count => {
      setUnreadCount(count);
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <View style={styles.container}>
        <View style={styles.left}>
          {/* Hamburger */}
          <TouchableOpacity
            onPress={() => setIsSidebarOpen(true)}
            style={styles.iconBtn}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Svg width={30} height={20} viewBox="0 0 30 20" fill="none">
              <Path d="M0 0H30V3H0V0Z" fill="#1a1a1a" />
              <Path d="M0 8.5H30V11.5H0V8.5Z" fill="#1a1a1a" />
              <Path d="M0 17H30V20H0V17Z" fill="#1a1a1a" />
            </Svg>
          </TouchableOpacity>

          {/* Logo */}
          <Image
            source={require('../../assets/logos/parts_now.png')}
            style={{width: 186, height: 36}}
          />
        </View>

        {/* Notification Bell */}
        <TouchableOpacity
          onPress={onNotificationPress}
          style={styles.notificationBtn}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
              stroke="#1a1a1a"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
              stroke="#1a1a1a"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  notificationBtn: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E5383B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});
