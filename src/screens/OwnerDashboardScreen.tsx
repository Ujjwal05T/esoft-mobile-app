import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';

import {
  getDashboardStats,
  DashboardStatsResponse,
  createStaff,
  createStaffWithPhoto,
  type CreateStaffData,
  type RNFile,
} from '../services/api';
import {StaffFormData} from '../components/overlays/AddStaffOverlay';
import Header from '../components/dashboard/Header';
import StatusCard from '../components/dashboard/StatusCard';
import VehicleVector from '../assets/vectors/vehicle-vector.svg';
import InquiryVector from '../assets/vectors/inquiry-vector.svg';
import ClockVector from '../assets/vectors/clock-vector.svg';
import QuestionVector from '../assets/vectors/question-vector.svg';
import AddVehicleCard from '../components/dashboard/AddVehicleCard';
import AddStaffCard from '../components/dashboard/AddStaffCard';
import JobsCard from '../components/dashboard/JobsCard';
import EventCard from '../components/dashboard/EventCard';
import RunningPartsCard from '../components/dashboard/RunningPartsCard';
import RaisePartsCard from '../components/dashboard/RaisePartsCard';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';
import AddVehicleOverlay from '../components/overlays/AddVehicleOverlay';
import AddStaffOverlay from '../components/overlays/AddStaffOverlay';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';
import NewJobCardOverlay from '../components/overlays/NewJobCardOverlay';
import FiltersOverlay from '../components/overlays/FiltersOverlay';
import {SafeAreaView} from 'react-native-safe-area-context';

interface OwnerDashboardScreenProps {
  navigation?: any;
}


export default function OwnerDashboardScreen({navigation}: OwnerDashboardScreenProps) {
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Dashboard statistics state
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleStaffSubmit = async (staffData: StaffFormData): Promise<{success: boolean; error?: string}> => {
    const createData: CreateStaffData = {
      name: staffData.name,
      phoneNumber: staffData.contactNumber,
      email: staffData.email || undefined,
      role: staffData.role,
      address: staffData.address,
      jobCategories: staffData.jobCategories,
      canApproveVehicles: staffData.permissions.vehicleApprovals,
      canApproveInquiries: staffData.permissions.inquiryApprovals,
      canGenerateEstimates: staffData.permissions.generateEstimates,
      canCreateJobCard: staffData.permissions.createJobCard,
      canApproveDisputes: staffData.permissions.disputeApprovals,
      canApproveQuotesPayments: staffData.permissions.quoteApprovalsPayments,
      canAddVehicle: staffData.permissions.addVehicle,
      canRaiseDispute: staffData.permissions.raiseDispute,
      canCreateInquiry: staffData.permissions.createInquiry,
    };

    let response;
    if (staffData.photoUri) {
      const photo: RNFile = {uri: staffData.photoUri, type: 'image/jpeg', name: 'staff-photo.jpg'};
      response = await createStaffWithPhoto(createData, photo);
    } else {
      response = await createStaff(createData);
    }

    if (response.success) {
      setAddStaffOpen(false);
      setAlert({type: 'success', message: 'Staff member added successfully.'});
      return {success: true};
    }
    return {success: false, error: response.error || 'Failed to add staff'};
  };

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await getDashboardStats();

    if (response.success && response.data) {
      setStats(response.data);
    } else {
      setError(response.error || 'Failed to load dashboard statistics');
    }

    setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardStats()]);
    setRefreshing(false);
  }, [fetchDashboardStats]);

  // Fetch dashboard stats on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const fabOptions = [
    {
      label: 'Add Vehicle',
      onPress: () => setAddVehicleOpen(true),
    },
    {
      label: 'New Job Card',
      onPress: () => setNewJobOpen(true),
    },
    {
      label: 'Filters',
      onPress: () => setFiltersOpen(true),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header (sidebar is managed internally by Header) */}
      <Header onNotificationPress={() => navigation?.navigate('Notifications')} />

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#e5383b']}
            tintColor="#e5383b"
          />
        }>

        {/* ── Status Cards – 2-column grid ── */}
        <View style={styles.statusGrid}>
          <View style={styles.statusRow}>
            <StatusCard
              title="Orders in Process"
              value={loading ? '...' : String(stats?.ordersInProcess ?? 0)}
              bgColor="#f24822"
              onPress={() => navigation?.navigate('Orders')}
              VectorIcon={VehicleVector}
              vectorWidth={147}
              vectorHeight={120}
              vectorTop={25}
              vectorRight={-65}
            />
            <StatusCard
              title="Pending Quotes"
              value={loading ? '...' : String(stats?.pendingQuotes ?? 0)}
              bgColor="#2294f2"
              onPress={() => navigation?.navigate('Inquiry')}
              VectorIcon={InquiryVector}
              vectorWidth={110}
              vectorHeight={110}
              vectorTop={49}
              vectorOpacity={0.35}
              vectorRight={-29}
            />
          </View>
          <View style={styles.statusRow}>
            <StatusCard
              title="Pending Part Requests"
              value={loading ? '...' : String(stats?.pendingPartRequests ?? 0)}
              bgColor="#ffad2a"
              onPress={() => navigation?.navigate('Inquiry')}
              VectorIcon={ClockVector}
              vectorWidth={100}
              vectorHeight={100}
              vectorTop={40}
              vectorRight={-5}
            />
            <StatusCard
              title="Raised Disputes"
              value={loading ? '...' : String(stats?.raisedDisputes ?? 0)}
              bgColor="#e43cd3"
              onPress={() => navigation?.navigate('Inquiry')}
              VectorIcon={QuestionVector}
              vectorWidth={100}
              vectorHeight={100}
              vectorTop={40}
              vectorRight={-5}
            />
          </View>
        </View>

        {/* Error message if stats loading failed */}
        {error && (
          <View style={{padding: 16, backgroundColor: '#ffebee', borderRadius: 8}}>
            <Text style={{color: '#c62828', fontSize: 14}}>{error}</Text>
          </View>
        )}

        {/* ── Add New Vehicle Card ── */}
        <AddVehicleCard onPress={() => setAddVehicleOpen(true)} />

        {/* ── Add Staff Card ── */}
        <AddStaffCard onPress={() => setAddStaffOpen(true)} />

        


        {/* ── Pending Vehicle Requests / Jobs Card ── */}
        <JobsCard />

        {/* ── Valvoline Event Card ── */}
        <EventCard
          title="Valvoline Mechanic Meet"
          date="12 December 2025"
          time="7 PM - 10 PM"
          venue="Sayaji Effotel"
        />

        {/* ── Running Parts ── */}
        <RunningPartsCard />

        {/* ── Get Instant Quotes Card ── */}
        <RaisePartsCard text1="Get Instant Quotes" text2="For OEM Spareparts" />

        {/* ── #1 Tagline Block ── */}
        <View style={styles.taglineBlock}>
          <Text style={styles.taglineNumber}>#1</Text>
          <Text style={styles.taglineText}>
            Your One Stop{'\n'}Solution for OEM{'\n'}Spare Parts
          </Text>
        </View>

      </ScrollView>

      {/* Floating Action Button */}
      {/* <FloatingActionButton navigationOptions={fabOptions} /> */}

      {/* ── Overlays ── */}
      <AddVehicleOverlay
        isOpen={addVehicleOpen}
        onClose={() => setAddVehicleOpen(false)}
      />

      <AddStaffOverlay
        isOpen={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        onSubmit={handleStaffSubmit}
      />

      <NewJobCardOverlay
        isOpen={newJobOpen}
        onClose={() => setNewJobOpen(false)}
        vehicleId={0}
      />

      <FiltersOverlay
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={filters => {
          console.log('Filters applied:', filters);
          setFiltersOpen(false);
        }}
        onVehicleSelected={vehicleId => {
          setFiltersOpen(false);
          navigation?.navigate('VehicleDetail', {vehicleId});
        }}
      />

      <AppAlert
        isOpen={!!alert}
        type={alert?.type ?? 'info'}
        message={alert?.message ?? ''}
        onClose={() => setAlert(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 24,
  },
  statusGrid: {
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  taglineBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  taglineNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: '#e5383b',
    lineHeight: 77,
    letterSpacing: -1,
  },
  taglineText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e5383b',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
});
