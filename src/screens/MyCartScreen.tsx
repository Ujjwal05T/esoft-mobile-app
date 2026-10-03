import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation/CatalogStack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useCart } from '../context/CartContext';
import RedHeader from '../components/catalog/RedHeader';
import { PartRow, VehicleDetailsCard } from '../components/catalog/CartParts';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import { useSendInquiry } from '../components/catalog/useSendInquiry';
import AppAlert from '../components/overlays/AppAlert';

export default function MyCartScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const tabBarHeight = useTabBarHeight();
  const { items, vehicle, increment, decrement } = useCart();
  const sendInquiry = useSendInquiry();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const availableItems = items.filter(i => !i.product.outOfStock);
  const outOfStockItems = items.filter(i => i.product.outOfStock);

  const hasAvailable = availableItems.length > 0;
  const hasOutOfStock = outOfStockItems.length > 0;

  const handleViewVehicle = () => {
    if (!vehicle) return;
    navigation
      .getParent()
      ?.getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('VehicleDetail', { vehicleId: vehicle.id });
  };

  const handlePlaceInquiry = () => {
    const error = sendInquiry();
    if (error) setAlertMessage(error);
  };

  return (
    <View style={styles.container}>
      <RedHeader title="Cart" onBack={() => navigation.goBack()} />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: tabBarHeight + 16 },
            ]}
          >
            <VehicleDetailsCard
              vehicle={vehicle}
              onViewDetails={handleViewVehicle}
            />

            {hasAvailable && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Available Parts ({availableItems.length})
                </Text>
                <View style={styles.divider} />
                {availableItems.map((item, i) => (
                  <View key={item.product.id} style={i > 0 && styles.separator}>
                    <PartRow
                      item={item}
                      onIncrement={increment}
                      onDecrement={decrement}
                    />
                  </View>
                ))}
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.outlineBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.outlineBtnText}>Add More Parts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ctaBtn, styles.stackedBtn]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('PlaceOrder')}
                >
                  <Text style={styles.ctaText}>Place Order</Text>
                </TouchableOpacity>
              </View>
            )}

            {hasOutOfStock && (
              <View style={[styles.card, styles.outCard]}>
                <Text style={[styles.cardTitle, styles.outTitle]}>
                  Out of Stock ({outOfStockItems.length})
                </Text>
                <View style={[styles.divider, styles.outDivider]} />
                {outOfStockItems.map((item, i) => (
                  <View key={item.product.id} style={i > 0 && styles.separator}>
                    <PartRow
                      item={item}
                      onIncrement={increment}
                      onDecrement={decrement}
                    />
                  </View>
                ))}
                <View style={[styles.divider, styles.outDivider]} />
                <TouchableOpacity
                  style={styles.outlineBtn}
                  activeOpacity={0.8}
                  onPress={handlePlaceInquiry}
                >
                  <Text style={styles.outlineBtnText}>
                    Send Inquiry for Availability
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkBtn}
                  activeOpacity={0.7}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.linkText}>Add More Parts</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </>
      )}

      <AppAlert
        isOpen={!!alertMessage}
        type="info"
        message={alertMessage ?? ''}
        onClose={() => setAlertMessage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 16, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  outCard: { backgroundColor: '#fce8e6', borderColor: '#f3c9c5' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#161a1d' },
  outTitle: { color: '#e5383b' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  outDivider: { backgroundColor: '#f3c9c5' },
  separator: { borderTopWidth: 1, borderTopColor: '#f0f0f0' },

  stackedBtn: { marginTop: 10 },
  ctaBtn: {
    height: 44,
    borderRadius: 4,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtn: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { fontSize: 15, color: '#e5383b' },
  linkBtn: { alignItems: 'center', paddingTop: 14, paddingBottom: 2 },
  linkText: { fontSize: 15, fontWeight: '600', color: '#e5383b' },
  ctaText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { fontSize: 16, color: '#6b7280' },
  primaryBtn: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 6,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
});
