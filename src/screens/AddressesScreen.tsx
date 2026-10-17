import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation/CatalogStack';
import RedHeader from '../components/catalog/RedHeader';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import AppAlert from '../components/overlays/AppAlert';
import {
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  type WorkshopAddress,
} from '../services/api';

type Route = NativeStackScreenProps<
  CatalogStackParamList,
  'Addresses'
>['route'];

export function formatAddress(a: WorkshopAddress): string {
  return [a.addressLine, a.landmark, a.city, a.state]
    .filter(Boolean)
    .join(', ')
    .concat(` - ${a.pinCode}`);
}

// The workshop's delivery addresses, shared by the owner and staff.
// With `select` set, tapping an address chooses it for the order.
export default function AddressesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const { params } = useRoute<Route>();
  const select = !!params?.select;
  const tabBarHeight = useTabBarHeight();

  const [addresses, setAddresses] = useState<WorkshopAddress[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | undefined>(
    params?.selectedId,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<WorkshopAddress | null>(
    null,
  );

  const load = useCallback(async () => {
    const res = await getAddresses();
    if (res.success && res.data) setAddresses(res.data);
    else {
      setAddresses(prev => prev ?? []);
      setMessage(res.error ?? 'Could not load addresses.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const choose = (a: WorkshopAddress) => {
    if (!select) return;
    setSelectedId(a.id);
    navigation.popTo('PlaceOrder', { addressId: a.id });
  };

  const makeDefault = async (a: WorkshopAddress) => {
    const res = await setDefaultAddress(a.id);
    if (res.success && res.data) setAddresses(res.data);
    else setMessage(res.error ?? 'Could not change the default address.');
  };

  const remove = async (a: WorkshopAddress) => {
    setConfirmDelete(null);
    const res = await deleteAddress(a.id);
    if (res.success && res.data) {
      setAddresses(res.data);
      if (selectedId === a.id) setSelectedId(undefined);
    } else {
      setMessage(res.error ?? 'Could not delete the address.');
    }
  };

  return (
    <View style={styles.container}>
      <RedHeader
        title={select ? 'Select Address' : 'Delivery Addresses'}
        onBack={() => navigation.goBack()}
      />

      {addresses === null ? (
        <View style={styles.center}>
          <ActivityIndicator color="#e5383b" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: tabBarHeight + 24 },
          ]}
        >
          {addresses.length === 0 && (
            <Text style={styles.emptyText}>No saved addresses yet.</Text>
          )}

          {addresses.map(a => {
            const active = select && selectedId === a.id;
            return (
              <TouchableOpacity
                key={a.id}
                activeOpacity={select ? 0.8 : 1}
                onPress={() => choose(a)}
                style={[styles.card, active && styles.cardActive]}
              >
                <View style={styles.cardHead}>
                  <Text style={styles.label}>{a.label || 'Address'}</Text>
                  {a.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.name}>
                  {a.contactName} · {a.phone}
                </Text>
                <Text style={styles.addr}>{formatAddress(a)}</Text>
                {!a.state && (
                  <Text style={styles.warn}>
                    State is missing. Edit to add it.
                  </Text>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('AddressForm', { address: a })
                    }
                  >
                    <Text style={styles.link}>Edit</Text>
                  </TouchableOpacity>
                  {!a.isDefault && (
                    <TouchableOpacity onPress={() => makeDefault(a)}>
                      <Text style={styles.link}>Set as default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setConfirmDelete(a)}>
                    <Text style={styles.linkMuted}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AddressForm', {})}
          >
            <Text style={styles.addBtnText}>+ Add New Address</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <AppAlert
        isOpen={!!message}
        type="info"
        message={message ?? ''}
        onClose={() => setMessage(null)}
      />
      <AppAlert
        isOpen={!!confirmDelete}
        type="confirm"
        message="Delete this address? Orders already placed keep their address."
        confirmText="Delete"
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  cardActive: { borderColor: '#e5383b', backgroundColor: '#fff5f5' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#161a1d' },
  defaultBadge: {
    backgroundColor: '#fce8e6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultText: { fontSize: 11, fontWeight: '600', color: '#e5383b' },
  name: { fontSize: 13, color: '#374151', marginTop: 6 },
  addr: { fontSize: 13, color: '#6b7280', marginTop: 2, lineHeight: 18 },
  warn: { fontSize: 12, color: '#e5383b', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 20, marginTop: 10 },
  link: { fontSize: 13, fontWeight: '600', color: '#e5383b' },
  linkMuted: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  addBtn: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 15, color: '#e5383b' },
});
