import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect, CompositeNavigationProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import Svg, {Path as SvgPath} from 'react-native-svg';
import VehicleCard from '../components/dashboard/VehicleCard';
import {RootStackParamList} from '../navigation/RootNavigator';
import {MainTabParamList} from '../navigation/TabNavigator';
import AddVehicleOverlay from '../components/overlays/AddVehicleOverlay';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';
import {getVehicles, getStaffProfile, type VehicleResponse, type StaffPermissions} from '../services/api';
import Header from '../components/dashboard/Header';

// Composite navigation type that supports both tab and stack navigation
type StaffVehicleScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface DisplayVehicle {
  id: string;
  plateNumber: string;
  year?: number;
  make: string;
  model: string;
  specs?: string;
  services?: string[];
  additionalServices?: number;
  status: 'Active' | 'Inactive' | 'Requested';
}

// ── Inline SVG Icon ───────────────────────────────────────────────────────────

function EmptyCarIcon() {
  return (
    <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
      <SvgPath
        d="M19 17H22L20.595 9.81C20.5164 9.35162 20.2816 8.9373 19.9312 8.63643C19.5809 8.33557 19.1372 8.16742 18.675 8.159H5.325C4.86276 8.16742 4.41909 8.33557 4.06878 8.63643C3.71847 8.9373 3.48358 9.35162 3.405 9.81L2 17H5M19 17V17.5C19 18.163 18.7366 18.7989 18.2678 19.2678C17.7989 19.7366 17.163 20 16.5 20C15.837 20 15.2011 19.7366 14.7322 19.2678C14.2634 18.7989 14 18.163 14 17.5V17M19 17H14M5 17V17.5C5 18.163 5.26339 18.7989 5.73223 19.2678C6.20107 19.7366 6.83696 20 7.5 20C8.16304 20 8.79893 19.7366 9.26777 19.2678C9.73661 18.7989 10 18.163 10 17.5V17M5 17H10M10 17H14"
        stroke="#ccc"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function StaffVehicleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StaffVehicleScreenNavigationProp>();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicles, setVehicles] = useState<DisplayVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [result, profileResult] = await Promise.all([
        getVehicles(),
        getStaffProfile(),
      ]);

      if (profileResult.success && profileResult.data) {
        setPermissions(profileResult.data.permissions);
      }
      if (result.success && result.data) {
        const activeVehicles: DisplayVehicle[] = result.data.vehicles
          .filter((v: VehicleResponse) => v.status === 'Active')
          .map((v: VehicleResponse) => ({
            id: String(v.id),
            plateNumber: v.plateNumber,
            year: v.year ?? undefined,
            make: v.brand ?? 'Unknown',
            model: v.model ?? 'Unknown',
            specs: v.specs ?? v.variant ?? undefined,
            services: [],
            additionalServices: 0,
            status: 'Active' as const,
          }));
        setVehicles(activeVehicles);
      } else {
        setError(result.error ?? 'Failed to load vehicles.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles]),
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <Header onNotificationPress={() => navigation.navigate('Notifications')} />

      {/* ── Loading State ─────────────────────────────────────────────── */}
      {isLoading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e5383b" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      )}

      {/* ── Error State ───────────────────────────────────────────────── */}
      {error !== null && !isLoading && (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={fetchVehicles}
            activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Empty State ───────────────────────────────────────────────── */}
      {!isLoading && error === null && vehicles.length === 0 && (
        <View style={styles.centerContainer}>
          <EmptyCarIcon />
          <Text style={styles.emptyTitle}>No vehicles found</Text>
          <Text style={styles.emptySubtitle}>
            Add your first vehicle to get started
          </Text>
          {(permissions === null || permissions.addVehicle) && (
            <TouchableOpacity
              style={[styles.actionBtn, {marginTop: 8}]}
              onPress={() => setShowAddVehicle(true)}
              activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Add Vehicle</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Vehicle List ──────────────────────────────────────────────── */}
      {!isLoading && error === null && vehicles.length > 0 && (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            {paddingBottom: insets.bottom + 120},
          ]}
          showsVerticalScrollIndicator={false}>
          {vehicles.map(vehicle => (
            <TouchableOpacity
              key={vehicle.id}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('VehicleDetail', {vehicleId: Number(vehicle.id)})
              }>
              <VehicleCard
                plateNumber={vehicle.plateNumber}
                year={vehicle.year}
                make={vehicle.make}
                model={vehicle.model}
                specs={vehicle.specs ?? ''}
                services={vehicle.services ?? []}
                additionalServices={vehicle.additionalServices ?? 0}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Floating Action Button ────────────────────────────────────── */}
      <FloatingActionButton
        navigationOptions={[
          {
            label: 'Add new vehicle',
            onPress: () => setShowAddVehicle(true),
            disabled: permissions !== null && !permissions.addVehicle,
          },
        ]}
      />

      {/* ── Add Vehicle Overlay ───────────────────────────────────────── */}
      <AddVehicleOverlay
        isOpen={showAddVehicle}
        onClose={() => {
          setShowAddVehicle(false);
          fetchVehicles();
        }}
        onSubmitRequest={() => fetchVehicles()}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#ffffff'},

  // States
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingText: {fontSize: 14, color: '#666'},
  errorText: {
    fontSize: 15,
    color: '#e5383b',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtitle: {fontSize: 14, color: '#999', textAlign: 'center'},
  actionBtn: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {color: '#ffffff', fontSize: 14, fontWeight: '500'},

  // Vehicle list
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
});
