import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect, CompositeNavigationProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {RootStackParamList} from '../navigation/RootNavigator';
import {MainTabParamList} from '../navigation/TabNavigator';
import StatusCard from '../components/dashboard/StatusCard';
import AddVehicleCard from '../components/dashboard/AddVehicleCard';
import RaisePartsCard from '../components/dashboard/RaisePartsCard';
import JobsCard from '../components/dashboard/JobsCard';
import AddVehicleOverlay from '../components/overlays/AddVehicleOverlay';
import VehicleSelectionOverlay, {
  type VehicleInfo,
} from '../components/overlays/VehicleSelectionOverlay';
import RequestPartOverlay from '../components/overlays/RequestPartOverlay';
import Header from '../components/dashboard/Header';
import {
  getVehicles,
  getStoredUser,
  getInquiriesByWorkshopOwnerId,
  createInquiryWithMedia,
  getStaffProfile,
  getActiveVehicleVisit,
  getJobCardsByVehicle,
  type VehicleResponse,
  type InquiryItemRequest,
  type StaffPermissions,
} from '../services/api';
import NoPermissionOverlay from '../components/overlays/NoPermissionOverlay';

// Import vector icons for StatusCards
import VehicleVectorIcon from '../assets/vectors/vehicle-vector.svg';
import InquiryVectorIcon from '../assets/vectors/inquiry-vector.svg';

// Composite navigation type that supports both tab and stack navigation
type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation?: any;
}

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [refreshing, setRefreshing] = useState(false);

  // State for dynamic data
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [approvedInquiriesCount, setApprovedInquiriesCount] = useState(0);
  const [totalInquiriesCount, setTotalInquiriesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Staff permissions
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions | null>(null);

  // Overlay states
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [showRequestPart, setShowRequestPart] = useState(false);
  const [showNoPermission, setShowNoPermission] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(
    null,
  );
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [activeVisitCategories, setActiveVisitCategories] = useState<string[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await getStoredUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch vehicles count
      const vehiclesResult = await getVehicles();
      if (vehiclesResult.success && vehiclesResult.data) {
        const activeVehicles = vehiclesResult.data.vehicles.filter(
          (v: VehicleResponse) => v.status === 'Active',
        );
        setVehiclesCount(activeVehicles.length);
      }

      // Fetch inquiries for approval ratio
      const inquiriesResult = await getInquiriesByWorkshopOwnerId(user.id);
      if (inquiriesResult.success && inquiriesResult.data) {
        const inquiries = inquiriesResult.data.inquiries;
        const approved = inquiries.filter(
          (i: any) => i.status.toLowerCase() === 'approved',
        );
        setApprovedInquiriesCount(approved.length);
        setTotalInquiriesCount(inquiries.length);
      }

      // Fetch staff permissions if user is staff
      if (user.role === 'staff') {
        const profileResult = await getStaffProfile();
        if (profileResult.success && profileResult.data) {
          setStaffPermissions(profileResult.data.permissions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData()]);
    setRefreshing(false);
  }, [fetchDashboardData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  const handleVehicleSelected = async (
    vehicle: VehicleResponse,
    info: VehicleInfo,
  ) => {
    setSelectedVehicle(vehicle);
    setVehicleInfo(info);

    // Fetch categories: owner uses active visit, staff uses assigned job cards
    const user = await getStoredUser();
    if (user) {
      if (user.role === 'staff') {
        const jobRes = await getJobCardsByVehicle(vehicle.id);
        if (jobRes.success && jobRes.data) {
          const cats = [
            ...new Set(
              jobRes.data.jobCards
                .filter(j => j.assignedStaffIds?.includes(user.id))
                .map(j => j.jobCategory)
                .filter(Boolean),
            ),
          ];
          setActiveVisitCategories(cats);
        }
      } else {
        const visitRes = await getActiveVehicleVisit(vehicle.id);
        setActiveVisitCategories(visitRes.data?.activeJobCategories ?? []);
      }
    }

    setShowRequestPart(true);
  };

  const handleRequestPartSubmit = async (parts: any[]) => {
    try {
      const user = await getStoredUser();
      if (!user || !selectedVehicle) {
        console.error('User or vehicle not found');
        return;
      }

      // Collect audio and image files
      const audioFiles: any[] = [];
      const imageFiles: any[] = [];

      const items: InquiryItemRequest[] = parts.map(part => {
        if (part.audioPath) {
          audioFiles.push({
            uri: part.audioPath,
            name: `audio_${Date.now()}_${audioFiles.length}.mp4`,
            type: 'audio/mp4',
          });
        }

        part.images.forEach((img: any) => {
          if (img && img.uri) {
            imageFiles.push({
              uri: img.uri,
              name: img.name || `image_${Date.now()}_${imageFiles.length}.jpg`,
              type: 'image/jpeg',
            });
          }
        });

        return {
          partName: part.partName,
          preferredBrand: part.preferredBrand,
          afterMarketBrandName: part.preferredBrand === 'After Market' ? part.afterMarketBrandName : undefined,
          quantity: parseInt(part.quantity, 10) || 1,
          remark: part.remark,
          audioDuration: part.audioDuration || undefined,
        };
      });

      const staffProfileRes = await getStaffProfile();
      const workshopOwnerId = staffProfileRes.data?.workshopOwnerId ?? user.id;

      const result = await createInquiryWithMedia(
        selectedVehicle.id,
        workshopOwnerId,
        activeVisitCategories,
        items,
        audioFiles,
        imageFiles,
        undefined,
        user.id,
      );

      if (result.success) {
        setShowRequestPart(false);
        fetchDashboardData(); // Refresh dashboard
      }
    } catch (error) {
      console.error('Error creating inquiry:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Header onNotificationPress={() => navigation.navigate('Notifications')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#e5383b']}
            tintColor="#e5383b"
          />
        }>
        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e5383b" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <>
            {/* Status Cards Row */}
            <View style={styles.statusRow}>
              <StatusCard
                title="Vehicles Assigned"
                value={vehiclesCount}
                bgColor="#e5383b"
                VectorIcon={VehicleVectorIcon}
                vectorWidth={147}
                vectorHeight={120}
                vectorTop={30}
                vectorRight={-65}
                onPress={() => navigation?.navigate('Vehicle')}
              />
              <StatusCard
                title="Approved Inquiry"
                value={`${approvedInquiriesCount}/${totalInquiriesCount}`}
                bgColor="#2294F2"
                VectorIcon={InquiryVectorIcon}
                vectorWidth={110}
                vectorHeight={110}
                vectorTop={49}
                vectorRight={-29}
                onPress={() => navigation?.navigate('Inquiry')}
              />
            </View>

            {/* Add Vehicle Card */}
            <AddVehicleCard
              onPress={() => {
                if (staffPermissions && !staffPermissions.addVehicle) {
                  setShowNoPermission(true);
                } else {
                  setShowAddVehicle(true);
                }
              }}
            />

            {/* Raise Parts Inquiry Card */}
            <RaisePartsCard
              onPress={() => {
                if (staffPermissions && !staffPermissions.createInquiry) {
                  setShowNoPermission(true);
                } else {
                  setShowVehicleSelection(true);
                }
              }}
            />

            {/* Jobs Card */}
            <JobsCard />
          </>
        )}
      </ScrollView>

      {/* Add Vehicle Overlay */}
      <AddVehicleOverlay
        isOpen={showAddVehicle}
        onClose={() => {
          setShowAddVehicle(false);
          fetchDashboardData(); // Refresh after adding vehicle
        }}
        onSubmitRequest={() => fetchDashboardData()}
      />

      {/* Vehicle Selection Overlay for Parts Request */}
      <VehicleSelectionOverlay
        isOpen={showVehicleSelection}
        onClose={() => setShowVehicleSelection(false)}
        onVehicleSelected={handleVehicleSelected}
        title="Select Vehicle for Parts Request"
      />

      {/* Request Part Overlay */}
      {vehicleInfo && (
        <RequestPartOverlay
          isOpen={showRequestPart}
          onClose={() => setShowRequestPart(false)}
          onSubmit={handleRequestPartSubmit}
        />
      )}

      {/* No Permission Overlay */}
      <NoPermissionOverlay
        isOpen={showNoPermission}
        onClose={() => setShowNoPermission(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#828282',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 16,
  },
});

export default HomeScreen;
