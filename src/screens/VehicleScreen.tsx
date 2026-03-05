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
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Svg, {Path as SvgPath} from 'react-native-svg';
import VehicleCard from '../components/dashboard/VehicleCard';
import {RootStackParamList} from '../navigation/RootNavigator';
import AddVehicleOverlay from '../components/overlays/AddVehicleOverlay';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';
import FiltersOverlay, {FilterData} from '../components/overlays/FiltersOverlay';
import {getCurrentVehicles, getVehicles, type VehicleVisitResponse, type VehicleResponse} from '../services/api';
import Header from '../components/dashboard/Header';

interface DisplayVehicle {
  id: string;
  vehicleId: string;
  plateNumber: string;
  year?: number;
  make: string;
  model: string;
  specs?: string;
  services?: string[];
  additionalServices?: number;
  addedBy?: string;
  createdAt?: string;
}

// ── Inline SVG Icons ──────────────────────────────────────────────────────────

function FilterIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <SvgPath
        d="M4 11L4 5"
        stroke="#e5383b"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SvgPath
        d="M12 11L12 5"
        stroke="#e5383b"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SvgPath
        d="M6 5L4 3L2 5"
        stroke="#e5383b"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SvgPath
        d="M14 11L12 13L10 11"
        stroke="#e5383b"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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

// ── Helper Functions ──────────────────────────────────────────────────────────

// Parse date from DD/MM/YY format to Date object
function parseFilterDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  const fullYear = parseInt('20' + year);
  return new Date(fullYear, parseInt(month) - 1, parseInt(day));
}

// Check if a date is within range
function isDateInRange(
  dateStr: string | undefined,
  startDate: string,
  endDate: string,
): boolean {
  if (!dateStr || (!startDate && !endDate)) return true;

  const date = new Date(dateStr);
  const start = parseFilterDate(startDate);
  const end = parseFilterDate(endDate);

  if (start && date < start) return false;
  if (end && date > end) return false;

  return true;
}

// Count active filters
function countActiveFilters(filters: FilterData): number {
  let count = 0;
  if (filters.startDate || filters.endDate) count++;
  if (filters.brand) count++;
  if (filters.model) count++;
  if (filters.year) count++;
  if (filters.vehicleNumber) count++;
  if (filters.assignedTo) count++;
  if (filters.addedBy) count++;
  if (filters.sortBy) count++;
  return count;
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function VehicleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'all' | 'requested'>('all');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [vehicles, setVehicles] = useState<DisplayVehicle[]>([]);
  const [requestedVehicles, setRequestedVehicles] = useState<DisplayVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<DisplayVehicle[]>([]);
  const [filteredRequestedVehicles, setFilteredRequestedVehicles] = useState<DisplayVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterData>({
    startDate: '',
    endDate: '',
    brand: '',
    model: '',
    year: '',
    vehicleNumber: '',
    assignedTo: '',
    addedBy: '',
    sortBy: null,
  });

  const applyFilters = useCallback((vehicleList: DisplayVehicle[], filters: FilterData) => {
    let filtered = [...vehicleList];

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(v =>
        isDateInRange(v.createdAt, filters.startDate, filters.endDate),
      );
    }

    // Filter by brand
    if (filters.brand) {
      filtered = filtered.filter(v =>
        v.make.toUpperCase() === filters.brand.toUpperCase(),
      );
    }

    // Filter by model
    if (filters.model) {
      filtered = filtered.filter(v =>
        v.model.toUpperCase().includes(filters.model.toUpperCase()),
      );
    }

    // Filter by year
    if (filters.year) {
      filtered = filtered.filter(v => v.year === parseInt(filters.year));
    }

    // Filter by vehicle number
    if (filters.vehicleNumber) {
      filtered = filtered.filter(v =>
        v.plateNumber.toUpperCase().includes(filters.vehicleNumber.toUpperCase()),
      );
    }

    // Filter by assigned to
    if (filters.assignedTo) {
      filtered = filtered.filter(v =>
        v.addedBy?.toUpperCase().includes(filters.assignedTo.toUpperCase()),
      );
    }

    // Filter by added by
    if (filters.addedBy) {
      filtered = filtered.filter(v =>
        v.addedBy?.toUpperCase().includes(filters.addedBy.toUpperCase()),
      );
    }

    // Sort
    if (filters.sortBy === 'amount_low_high') {
      filtered.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
    } else if (filters.sortBy === 'amount_high_low') {
      filtered.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    }

    return filtered;
  }, []);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [currentResult, allResult] = await Promise.all([
        getCurrentVehicles(),
        getVehicles(),
      ]);

      if (currentResult.success && currentResult.data) {
        const gatedIn: DisplayVehicle[] = currentResult.data.visits.map(
          (v: VehicleVisitResponse) => ({
            id: String(v.id),
            vehicleId: String(v.vehicleId),
            plateNumber: v.vehicle?.plateNumber ?? '',
            year: v.vehicle?.year ?? undefined,
            make: v.vehicle?.brand ?? 'Unknown',
            model: v.vehicle?.model ?? 'Unknown',
            specs: v.vehicle?.specs ?? v.vehicle?.variant ?? undefined,
            services: (v.activeJobCategories ?? []).slice(0, 2),
            additionalServices: Math.max(0, (v.activeJobCategories?.length ?? 0) - 2),
            createdAt: v.gateInDateTime,
          }),
        );
        setVehicles(gatedIn);
        setFilteredVehicles(applyFilters(gatedIn, activeFilters));
      } else {
        setError(currentResult.error ?? 'Failed to load vehicles.');
      }

      if (allResult.success && allResult.data) {
        const requested: DisplayVehicle[] = allResult.data.vehicles
          .filter((v: VehicleResponse) => v.status === 'Requested')
          .map((v: VehicleResponse) => ({
            id: String(v.id),
            vehicleId: String(v.id),
            plateNumber: v.plateNumber,
            year: v.year ?? undefined,
            make: v.brand ?? 'Unknown',
            model: v.model ?? 'Unknown',
            specs: v.specs ?? v.variant ?? undefined,
            services: [],
            additionalServices: 0,
            createdAt: v.createdAt,
          }));
        setRequestedVehicles(requested);
        setFilteredRequestedVehicles(applyFilters(requested, activeFilters));
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, applyFilters]);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles]),
  );

  const handleApplyFilters = (filters: FilterData) => {
    setActiveFilters(filters);
    setFilteredVehicles(applyFilters(vehicles, filters));
    setFilteredRequestedVehicles(applyFilters(requestedVehicles, filters));
    setShowFilters(false);
  };

  const displayVehicles = activeTab === 'all' ? filteredVehicles : filteredRequestedVehicles;
  const filterCount = countActiveFilters(activeFilters);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <Header onNotificationPress={() => navigation.navigate('Notifications')} />

      {/* ── Tab Toggle + Filter ───────────────────────────────────────── */}
      <View style={styles.filterRow}>
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}>
            <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
              All ({filteredVehicles.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'requested' && styles.tabBtnActive]}
            onPress={() => setActiveTab('requested')}
            activeOpacity={0.8}>
            <Text style={[styles.tabBtnText, activeTab === 'requested' && styles.tabBtnTextActive]}>
              Requested ({filteredRequestedVehicles.length})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.8}>
          <FilterIcon />
          <Text style={styles.filterBtnText}>Filter</Text>
          {filterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
      {!isLoading && error === null && displayVehicles.length === 0 && (
        <View style={styles.centerContainer}>
          <EmptyCarIcon />
          <Text style={styles.emptyTitle}>
            {filterCount > 0
              ? 'No vehicles match your filters'
              : activeTab === 'all'
              ? 'No vehicles currently in workshop'
              : 'No requested vehicles'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filterCount > 0
              ? 'Try adjusting your filter criteria'
              : activeTab === 'all'
              ? 'Gate in a vehicle to see it here'
              : 'Staff-added vehicles will appear here'}
          </Text>
          {filterCount > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, {marginTop: 8}]}
              onPress={() => handleApplyFilters({
                startDate: '', endDate: '', brand: '', model: '',
                year: '', vehicleNumber: '', assignedTo: '', addedBy: '', sortBy: null,
              })}
              activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Vehicle List ──────────────────────────────────────────────── */}
      {!isLoading && error === null && displayVehicles.length > 0 && (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            {paddingBottom: insets.bottom + 120},
          ]}
          showsVerticalScrollIndicator={false}>
          {displayVehicles.map(vehicle => (
            <TouchableOpacity
              key={vehicle.id}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('VehicleDetail', {vehicleId: Number(vehicle.vehicleId)})
              }>
              <VehicleCard
                plateNumber={vehicle.plateNumber}
                year={vehicle.year}
                make={vehicle.make}
                model={vehicle.model}
                specs={vehicle.specs ?? ''}
                services={vehicle.services ?? []}
                additionalServices={vehicle.additionalServices ?? 0}
                addedBy={vehicle.addedBy}
                variant={activeTab === 'requested' ? 'scan' : 'default'}
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

      {/* ── Filters Overlay ───────────────────────────────────────────── */}
      <FiltersOverlay
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#ffffff'},

  // Tab toggle row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabBtnActive: {backgroundColor: '#e5383b'},
  tabBtnText: {fontSize: 13, fontWeight: '500', color: '#4c4c4c'},
  tabBtnTextActive: {color: '#ffffff'},

  // Filter button
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    position: 'relative',
  },
  filterBtnText: {fontSize: 13, fontWeight: '500', color: '#e5383b'},
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e5383b',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },

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
    paddingTop: 4,
    gap: 16,
  },
});
