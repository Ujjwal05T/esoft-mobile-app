import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import EtnaLogo from '../../assets/logos/etna-logo.svg';
import MobileSidebar from '../layout/MobileSidebar';

interface HeaderProps {
  onSearchPress?: () => void;
}

export default function Header({onSearchPress}: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          <EtnaLogo width={66} height={36} />
        </View>

        {/* Search */}
        <TouchableOpacity
          onPress={onSearchPress}
          style={styles.iconBtn}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
              stroke="#1a1a1a"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M21 21L16.65 16.65"
              stroke="#1a1a1a"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
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
});
