import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CatalogStackParamList } from '../navigation/CatalogStack';
import type { MainTabParamList } from '../navigation/TabNavigator';
import RedHeader from '../components/catalog/RedHeader';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import SearchIcon from '../assets/icons/search.svg';
import CartIcon from '../assets/icons/cart.svg';
import { getCatalogOrder, type CatalogOrder } from '../services/api';
import { formatPrice } from '../components/catalog/CartParts';
import { formatAddress } from './AddressesScreen';

type Props = NativeStackScreenProps<CatalogStackParamList, 'Checkout'>;

const UserIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={4} stroke="#ffffff" strokeWidth={2} />
    <Path
      d="M4 21C4 17.5 7.5 15 12 15C16.5 15 20 17.5 20 21"
      stroke="#ffffff"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 13L9.5 17.5L19 7"
      stroke="#ffffff"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function CheckoutScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const { params } = useRoute<Props['route']>();
  const tabBarHeight = useTabBarHeight();

  const [order, setOrder] = useState<CatalogOrder | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getCatalogOrder(params.orderId).then(res => {
      if (cancelled) return;
      if (res.success && res.data) setOrder(res.data);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [params.orderId]);

  // An admin sets the date in the portal; until then there is nothing to promise
  const delivery = order?.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Will be updated shortly';

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
        title="Checkout"
        onBack={goToCatalog}
        right={
          <View style={styles.headerIcons}>
            <SearchIcon width={20} height={20} color="#ffffff" />
            <UserIcon />
            <CartIcon width={20} height={20} color="#ffffff" />
          </View>
        }
      />

      <View style={styles.body}>
        <View style={styles.checkCircle}>
          <CheckIcon />
        </View>
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Your parts are being compiled for shipping.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={styles.value}>
              {order ? order.orderNumber : failed ? 'Check My Orders' : '…'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Est. Delivery</Text>
            <Text style={[styles.value, styles.valueRed]}>{delivery}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.value}>
              {order ? formatPrice(order.totalAmount) : '…'}
            </Text>
          </View>
          {order && (
            <View style={styles.row}>
              <Text style={styles.label}>Deliver To</Text>
              <Text style={[styles.value, styles.valueWrap]}>
                {order.contactName},{' '}
                {formatAddress({
                  ...order,
                  id: 0,
                  label: null,
                  isDefault: false,
                })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.actions, { paddingBottom: tabBarHeight + 16 }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={goToOrders}
        >
          <Text style={styles.primaryBtnText}>View My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToCatalog} activeOpacity={0.7}>
          <Text style={styles.linkText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4a9d3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#161a1d' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 6, marginBottom: 24 },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: { fontSize: 12, color: '#6b7280' },
  value: { fontSize: 13, fontWeight: '700', color: '#161a1d' },
  valueWrap: { flex: 1, textAlign: 'right', marginLeft: 16 },
  valueRed: { color: '#e5383b' },
  actions: { paddingHorizontal: 16, gap: 14, alignItems: 'center' },
  primaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 4,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  linkText: { fontSize: 14, fontWeight: '600', color: '#e5383b' },
});
