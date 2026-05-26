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
  getStoredUser,
  getActiveVehicleVisit,
  createInquiryWithMedia,
  type CreateStaffData,
  type RNFile,
  type VehicleResponse,
  type InquiryItemRequest,
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
import AddVehicleOverlay from '../components/overlays/AddVehicleOverlay';
import AddStaffOverlay from '../components/overlays/AddStaffOverlay';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';
import NewJobCardOverlay from '../components/overlays/NewJobCardOverlay';
import FiltersOverlay from '../components/overlays/FiltersOverlay';
import VehicleSelectionOverlay, {type VehicleInfo} from '../components/overlays/VehicleSelectionOverlay';
import VehicleTypeSelectionOverlay from '../components/overlays/VehicleTypeSelectionOverlay';
import RequestPartOverlay from '../components/overlays/RequestPartOverlay';
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
  const [showVehicleTypeSelection, setShowVehicleTypeSelection] = useState(false);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [addVehicleForOrderParts, setAddVehicleForOrderParts] = useState(false);
  const [showRequestPart, setShowRequestPart] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [activeVisitCategories, setActiveVisitCategories] = useState<string[]>([]);
  const [activeVisitId, setActiveVisitId] = useState<number | undefined>(undefined);

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

  const handleVehicleSelected = async (vehicle: VehicleResponse, _info: VehicleInfo) => {
    setSelectedVehicle(vehicle);
    const visitRes = await getActiveVehicleVisit(vehicle.id);
    setActiveVisitCategories(visitRes.data?.activeJobCategories?.length ? visitRes.data.activeJobCategories : ['Default']);
    setActiveVisitId(visitRes.data?.id);
    setShowVehicleSelection(false);
    setShowRequestPart(true);
  };

  const handleNewVehicleCreatedForOrderParts = async (vehicleId: number) => {
    setSelectedVehicle({id: vehicleId} as VehicleResponse);
    const visitRes = await getActiveVehicleVisit(vehicleId);
    setActiveVisitCategories(visitRes.data?.activeJobCategories?.length ? visitRes.data.activeJobCategories : ['Default']);
    setActiveVisitId(visitRes.data?.id);
    setAddVehicleForOrderParts(false);
    setShowRequestPart(true);
  };

  const handleRequestPartSubmit = async (parts: any[]) => {
    try {
      const user = await getStoredUser();
      if (!user || !selectedVehicle) {
        setAlert({type: 'error', message: 'User or vehicle not found. Please try again.'});
        return;
      }
      const audioFiles: any[] = [];
      const imageFiles: any[] = [];
      const items: InquiryItemRequest[] = parts.map(part => {
        if (part.audioPath) {
          audioFiles.push({uri: part.audioPath, name: `audio_${Date.now()}_${audioFiles.length}.mp4`, type: 'audio/mp4'});
        }
        part.images.forEach((img: any) => {
          if (img?.uri) {
            imageFiles.push({uri: img.uri, name: img.name || `image_${Date.now()}_${imageFiles.length}.jpg`, type: 'image/jpeg'});
          }
        });
        return {
          partName: part.partName,
          preferredBrand: part.preferredBrand,
          quantity: parseInt(part.quantity, 10) || 1,
          remark: part.remark,
          audioDuration: part.audioDuration || undefined,
        };
      });
      const result = await createInquiryWithMedia(
        selectedVehicle.id,
        user.id,
        activeVisitCategories,
        items,
        audioFiles,
        imageFiles,
        activeVisitId,
        null,
      );
      if (result.success) {
        setAlert({type: 'success', message: `Inquiry created successfully!\n\nInquiry Number: ${result.data?.inquiryNumber || 'N/A'}`, onDone: () => setShowRequestPart(false)});
      } else {
        setAlert({type: 'error', message: result.error || 'Failed to create inquiry'});
      }
    } catch {
      setAlert({type: 'error', message: 'An error occurred while creating the inquiry'});
    }
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

          {/* ── Get Instant Quotes Card ── Update: Used as Order Now as label but working is same */}
        <RaisePartsCard text1="Order parts," text2="Get Instant Quotes" onPress={() => setShowVehicleTypeSelection(true)} />

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
              onPress={() => navigation?.navigate('Inquiry', {initialTab: 'quotes'})}
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
              onPress={() => navigation?.navigate('Inquiry', {initialTab: 'inquiries'})}
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
              onPress={() => navigation?.navigate('Inquiry', {initialTab: 'disputes'})}
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

      <AddVehicleOverlay
        isOpen={addVehicleForOrderParts}
        onClose={() => setAddVehicleForOrderParts(false)}
        onVehicleCreated={handleNewVehicleCreatedForOrderParts}
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

      <VehicleTypeSelectionOverlay
        isOpen={showVehicleTypeSelection}
        onClose={() => setShowVehicleTypeSelection(false)}
        onSelectExisting={() => {
          setShowVehicleTypeSelection(false);
          setShowVehicleSelection(true);
        }}
        onSelectNew={() => {
          setShowVehicleTypeSelection(false);
          setAddVehicleForOrderParts(true);
        }}
      />

      <VehicleSelectionOverlay
        isOpen={showVehicleSelection}
        onClose={() => setShowVehicleSelection(false)}
        onVehicleSelected={handleVehicleSelected}
        title="Select Vehicle for Order Part"
      />

      {selectedVehicle && (
        <RequestPartOverlay
          isOpen={showRequestPart}
          onClose={() => setShowRequestPart(false)}
          onSubmit={handleRequestPartSubmit}
        />
      )}

      <AppAlert
        isOpen={!!alert}
        type={alert?.type ?? 'info'}
        message={alert?.message ?? ''}
        onClose={() => {
          const done = alert?.onDone;
          setAlert(null);
          done?.();
        }}
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
    gap: 16,
    marginTop: 0,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 16,
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
