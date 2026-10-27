import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import RedHeader from '../components/catalog/RedHeader';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';

const FEATURES = [
  'catalog.coming_soon_feature_filter',
  'catalog.coming_soon_feature_fit',
  'catalog.coming_soon_feature_order',
] as const;

function PartsIcon() {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8l-9-5-9 5v8l9 5 9-5V8z"
        stroke="#e5383b"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M3.3 7.6L12 12.5l8.7-4.9M12 12.5V21"
        stroke="#e5383b"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="#e5383b"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Shown in the Catalog tab while the backend has the catalog switched off
export default function CatalogComingSoonScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const tabBarHeight = useTabBarHeight();

  return (
    <View style={styles.container}>
      <RedHeader
        title={t('nav.catalog')}
        onBack={() => navigation.navigate('Home')}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <PartsIcon />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {t('catalog.coming_soon_badge')}
            </Text>
          </View>
          <Text style={styles.title}>{t('catalog.coming_soon_title')}</Text>
          <Text style={styles.message}>{t('catalog.coming_soon_message')}</Text>

          <View style={styles.features}>
            {FEATURES.map(key => (
              <View key={key} style={styles.featureRow}>
                <CheckIcon />
                <Text style={styles.featureText}>{t(key)}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.hint}
          onPress={() => navigation.navigate('Inquiry')}
        >
          <Text style={styles.hintText}>{t('catalog.coming_soon_hint')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 16, gap: 16 },
  card: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fdecec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    marginTop: 18,
    backgroundColor: '#e5383b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
  },
  title: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    color: '#161a1d',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
    textAlign: 'center',
  },
  features: { alignSelf: 'stretch', marginTop: 22, gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { flex: 1, fontSize: 14, color: '#161a1d' },
  hint: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 14,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#92400e',
    textAlign: 'center',
  },
});
