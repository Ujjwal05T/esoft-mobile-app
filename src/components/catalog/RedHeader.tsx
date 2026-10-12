import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface HeaderSearch {
  active: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  placeholder?: string;
}

interface RedHeaderProps {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
  // When active, the title and right-hand actions are replaced by a search field.
  search?: HeaderSearch;
}

const CloseIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 6L18 18M18 6L6 18"
      stroke="#ffffff"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="#ffffff"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function RedHeader({
  title,
  onBack,
  right,
  search,
}: RedHeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <BackIcon />
        </TouchableOpacity>
        {search?.active ? (
          <>
            <TextInput
              autoFocus
              value={search.value}
              onChangeText={search.onChange}
              placeholder={search.placeholder ?? 'Search'}
              placeholderTextColor="rgba(255,255,255,0.7)"
              returnKeyType="search"
              autoCorrect={false}
              selectionColor="#ffffff"
              style={styles.searchInput}
            />
            <TouchableOpacity
              onPress={search.onClose}
              activeOpacity={0.7}
              hitSlop={8}
              style={styles.searchClose}
            >
              <CloseIcon />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {right}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#e5383b' },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backBtn: { width: 32, alignItems: 'center', justifyContent: 'center' },
  searchInput: {
    flex: 1,
    height: 36,
    marginLeft: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    fontSize: 15,
    color: '#ffffff',
  },
  searchClose: {
    width: 32,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
  },
});
