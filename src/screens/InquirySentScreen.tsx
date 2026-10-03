import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CatalogStackParamList } from '../navigation/CatalogStack';
import type { MainTabParamList } from '../navigation/TabNavigator';
import { useCart } from '../context/CartContext';
import RedHeader from '../components/catalog/RedHeader';
import { PartRow, VehicleDetailsCard } from '../components/catalog/CartParts';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import SearchIcon from '../assets/icons/search.svg';

type Props = NativeStackScreenProps<CatalogStackParamList, 'InquirySent'>;

export default function InquirySentScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const { params } = useRoute<Props['route']>();
  const tabBarHeight = useTabBarHeight();
  const { vehicle } = useCart();

  const goToCatalog = () => navigation.popToTop();

  const goToOrders = () => {
    navigation.popToTop();
    navigation
      .getParent<BottomTabNavigationProp<MainTabParamList>>()
      ?.navigate('Orders');
  };

  return (
    <View style={styles.container}>
      <RedHeader
        title="Place Inquiry"
        onBack={goToCatalog}
        right={<SearchIcon width={22} height={22} color="#ffffff" />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + 16 },
        ]}
      >
        <View style={styles.sentCard}>
          <View style={styles.sentHeader}>
            <Text style={styles.sentTitle}>Inquiry Sent to ETNA</Text>
            <View style={styles.pendingPill}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          </View>
          <Text style={styles.sentSub}>
            Our team is reviewing your requested parts and will share a quote
            shortly.
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Inquiry ID</Text>
            <Text style={styles.infoValue}>{params.inquiryId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Raised on</Text>
            <Text style={styles.infoValue}>{params.raisedOn}</Text>
          </View>
          <View style={styles.responseChip}>
            <Text style={styles.responseText}>
              Expected Response Time Within 15 minutes
            </Text>
          </View>
        </View>

        <VehicleDetailsCard vehicle={vehicle} />

        <View style={styles.outCard}>
          <Text style={styles.outTitle}>
            Out of Stock ({params.items.length})
          </Text>
          <View style={styles.outDivider} />
          {params.items.map((item, i) => (
            <View key={item.product.id} style={i > 0 && styles.separator}>
              <PartRow item={item} />
            </View>
          ))}
          <View style={styles.outDivider} />
          {/* Inquiry is already raised, so the action is shown but disabled */}
          <View style={[styles.outlineBtn, styles.disabled]}>
            <Text style={styles.outlineBtnText}>
              Send Inquiry for Availability
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={goToCatalog}
        >
          <Text style={styles.primaryBtnText}>Back To Catalog</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.7}
          onPress={goToOrders}
        >
          <Text style={styles.linkText}>Open My Orders</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 16, gap: 12 },
  sentCard: {
    borderRadius: 10,
    backgroundColor: '#fdf1f0',
    padding: 14,
    gap: 8,
  },
  sentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sentTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#161a1d' },
  pendingPill: {
    backgroundColor: '#fbe0cc',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingText: { fontSize: 12, color: '#c2591a' },
  sentSub: { fontSize: 12, color: '#4b5563', marginBottom: 6 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 14, fontWeight: '700', color: '#161a1d' },
  infoValue: { fontSize: 14, color: '#161a1d' },
  responseChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#fbe3e1',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  responseText: { fontSize: 12, color: '#161a1d' },
  outCard: {
    borderWidth: 1,
    borderColor: '#f3c9c5',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fce8e6',
  },
  outTitle: { fontSize: 14, fontWeight: '600', color: '#e5383b' },
  outDivider: { height: 1, backgroundColor: '#f3c9c5', marginVertical: 8 },
  separator: { borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  outlineBtn: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  outlineBtnText: { fontSize: 14, color: '#e5383b' },
  primaryBtn: {
    height: 46,
    borderRadius: 4,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  linkBtn: { alignItems: 'center', paddingVertical: 4 },
  linkText: { fontSize: 14, fontWeight: '600', color: '#e5383b' },
});
