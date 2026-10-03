import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';

import {
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
import AddVehicleCard from '../components/dashboard/AddVehicleCard';
import AddStaffCard from '../components/dashboard/AddStaffCard';
import JobsCard from '../components/dashboard/JobsCard';
import EventCard from '../components/dashboard/EventCard';
import RunningPartsCard from '../components/dashboard/RunningPartsCard';
import RaisePartsCard from '../components/dashboard/RaisePartsCard';
import AftermarketCatalogCard from '../components/dashboard/AftermarketCatalogCard';
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
          partNumber: part.partNumber || undefined,
          preferredBrand: part.preferredBrand,
          quantity: parseInt(part.quantity, 10) || 1,
          remark: part.remark,
          audioDuration: part.audioDuration || undefined,
        };
      });
      const result = await createInquiryWithMedia(
        selectedVehicle.id,
        user.workshopOwnerId ?? user.id,
        activeVisitCategories,
        items,
        audioFiles,
        imageFiles,
        activeVisitId,
        user.role === 'staff' ? user.id : null,
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header (sidebar is managed internally by Header) */}
      <Header onNotificationPress={() => navigation?.navigate('Notifications')} />

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Get Instant Quotes Card ── */}
        <RaisePartsCard text1="Get Instant Quotes" text2="for OEM Spareparts" onPress={() => setShowVehicleTypeSelection(true)} />

        {/* ── Add New Vehicle Card ── */}
        <AddVehicleCard onPress={() => setAddVehicleOpen(true)} />

        {/* ── Aftermarket Spareparts Catalog Card ── */}
        {/* TODO: wire onPress once a Catalog screen/route exists */}
        <AftermarketCatalogCard />

        {/* ── Add Staff Card ── */}
        <AddStaffCard onPress={() => setAddStaffOpen(true)} />

        {/* ── Valvoline Engine Oils Promo Card ── */}
        <EventCard
          title="Valvoline Engine Oils"
          imageSrc={require('../assets/images/valvoline-card-image.png')}
          onPress={() => setAlert({type: 'info', message: 'Coming soon'})}
        />

        {/* ── Pending Vehicle Requests / Jobs Card ── */}
        {/* <JobsCard /> */}

        {/* ── Running Parts ── */}
        {/* <RunningPartsCard onCreateRequest={() => navigation?.navigate('RunningParts')} /> */}

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
    gap: 12,
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
