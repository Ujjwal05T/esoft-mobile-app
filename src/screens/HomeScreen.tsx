import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  type VehicleResponse,
  type InquiryItemRequest,
} from '../services/api';

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

  // State for dynamic data
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [approvedInquiriesCount, setApprovedInquiriesCount] = useState(0);
  const [totalInquiriesCount, setTotalInquiriesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Overlay states
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [showRequestPart, setShowRequestPart] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(
    null,
  );
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);

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
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
          quantity: parseInt(part.quantity, 10) || 1,
          remark: part.remark,
          audioDuration: part.audioDuration || undefined,
        };
      });

      const result = await createInquiryWithMedia(
        selectedVehicle.id,
        user.id,
        'Parts Request',
        items,
        audioFiles,
        imageFiles,
        undefined,
        null,
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
        contentContainerStyle={styles.scrollContent}>
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
                vectorTop={15}
                vectorOpacity={0.25}
                onPress={() => navigation?.navigate('Vehicle')}
              />
              <StatusCard
                title="Approved Inquiry"
                value={`${approvedInquiriesCount}/${totalInquiriesCount}`}
                bgColor="#161a1d"
                VectorIcon={InquiryVectorIcon}
                vectorTop={20}
                vectorOpacity={0.2}
                onPress={() => navigation?.navigate('Inquiry')}
              />
            </View>

            {/* Add Vehicle Card */}
            <AddVehicleCard onPress={() => setShowAddVehicle(true)} />

            {/* Raise Parts Inquiry Card */}
            <RaisePartsCard
              onPress={() => setShowVehicleSelection(true)}
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
