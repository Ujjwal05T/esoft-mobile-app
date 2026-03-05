/**
 * VehicleSelectionOverlay - Intermediate overlay for selecting a vehicle by plate number
 *
 * Use this when you need to open overlays (NewJobCardOverlay, EstimationOverlay, etc.)
 * from outside VehicleDetailScreen where you don't have vehicle context.
 *
 * Usage Example:
 * ```tsx
 * const [showVehicleSelection, setShowVehicleSelection] = useState(false);
 * const [showNewJob, setShowNewJob] = useState(false);
 * const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
 * const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
 *
 * // Step 1: Open vehicle selection
 * <VehicleSelectionOverlay
 *   isOpen={showVehicleSelection}
 *   onClose={() => setShowVehicleSelection(false)}
 *   onVehicleSelected={(vehicle, info) => {
 *     setSelectedVehicleId(vehicle.id);
 *     setVehicleInfo(info);
 *     setShowNewJob(true); // Open target overlay
 *   }}
 *   title="Select Vehicle for New Job"
 * />
 *
 * // Step 2: Target overlay opens with vehicle data
 * <NewJobCardOverlay
 *   isOpen={showNewJob}
 *   onClose={() => setShowNewJob(false)}
 *   vehicleId={selectedVehicleId!}
 * />
 * ```
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import VehicleCard from '../dashboard/VehicleCard';
import {
  getCurrentVehicles,
  type VehicleResponse,
  type VehicleVisitResponse,
} from '../../services/api';

const SCREEN_H = Dimensions.get('screen').height;

export interface VehicleInfo {
  plateNumber: string;
  year: number;
  make: string;
  model: string;
  specs: string;
}

interface VehicleSelectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleSelected?: (vehicle: VehicleResponse, vehicleInfo: VehicleInfo) => void;
  title?: string;
}

// Close icon
const CloseIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke="#161a1d"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Arrow Right icon
const ArrowRightIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12H19M19 12L12 5M19 12L12 19"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function VehicleSelectionOverlay({
  isOpen,
  onClose,
  onVehicleSelected,
  title = 'Select Vehicle',
}: VehicleSelectionOverlayProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!plateNumber.trim()) {
      setError('Please enter a plate number');
      return;
    }

    setIsSearching(true);
    setError(null);
    setVehicle(null);

    try {
      const result = await getCurrentVehicles();
      if (result.success && result.data) {
        // Search only within currently gated-in vehicles
        const foundVisit = result.data.visits.find(
          (v: VehicleVisitResponse) =>
            v.vehicle?.plateNumber.toLowerCase().trim() ===
            plateNumber.toLowerCase().trim(),
        );

        if (foundVisit && foundVisit.vehicle) {
          // Reconstruct as VehicleResponse shape for compatibility
          const vehicleData: VehicleResponse = {
            id: foundVisit.vehicle.id,
            plateNumber: foundVisit.vehicle.plateNumber,
            brand: foundVisit.vehicle.brand,
            model: foundVisit.vehicle.model,
            year: foundVisit.vehicle.year,
            variant: foundVisit.vehicle.variant,
            chassisNumber: null,
            specs: foundVisit.vehicle.specs,
            registrationName: null,
            ownerName: foundVisit.vehicle.ownerName,
            contactNumber: foundVisit.vehicle.contactNumber,
            email: null,
            gstNumber: null,
            insuranceProvider: null,
            odometerReading: null,
            observations: null,
            observationsAudioUrl: null,
            workshopOwnerId: foundVisit.workshopOwnerId,
            status: 'Active',
            createdAt: foundVisit.createdAt,
            updatedAt: foundVisit.updatedAt,
          };
          setVehicle(vehicleData);
          setError(null);
        } else {
          setError('Vehicle not found or not currently in the workshop');
          setVehicle(null);
        }
      } else {
        setError(result.error || 'Failed to search vehicles');
        setVehicle(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setVehicle(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVehicleSelect = () => {
    if (vehicle && onVehicleSelected) {
      const vehicleInfo: VehicleInfo = {
        plateNumber: vehicle.plateNumber,
        year: vehicle.year ?? 0,
        make: vehicle.brand ?? '',
        model: vehicle.model ?? '',
        specs: vehicle.specs ?? vehicle.variant ?? '',
      };
      onVehicleSelected(vehicle, vehicleInfo);
      handleClose();
    }
  };

  const handleClose = () => {
    setPlateNumber('');
    setVehicle(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Close Button */}
          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={0.7}
            style={styles.closeBtn}>
            <CloseIcon />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Search Section */}
            <View style={styles.section}>
              <View style={styles.plateInput}>
                <TextInput
                  value={plateNumber}
                  onChangeText={text => {
                    setPlateNumber(text.toUpperCase());
                    setError(null);
                  }}
                  placeholder="MP 09 GL 5656"
                  placeholderTextColor="#c4c4c4"
                  style={[
                    styles.plateTextInput,
                    plateNumber ? styles.plateTextInputFilled : null,
                  ]}
                  autoCapitalize="characters"
                  editable={!isSearching}
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity
                  onPress={handleSearch}
                  disabled={isSearching}
                  style={[
                    styles.arrowBtn,
                    plateNumber ? styles.arrowBtnActive : styles.arrowBtnInactive,
                  ]}>
                  {isSearching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ArrowRightIcon />
                  )}
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>

            {/* Vehicle Card */}
            {vehicle && (
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={handleVehicleSelect}
                  activeOpacity={0.9}
                  style={styles.vehicleCardWrapper}>
                  <VehicleCard
                    plateNumber={vehicle.plateNumber}
                    year={vehicle.year ?? undefined}
                    make={vehicle.brand ?? ''}
                    model={vehicle.model ?? ''}
                    specs={vehicle.specs ?? vehicle.variant ?? ''}
                    services={[]}
                    additionalServices={0}
                  />
                  <View style={styles.tapHint}>
                    <Text style={styles.tapHintText}>Tap to select</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_H * 0.85,
    paddingBottom: 51,
    paddingTop: 16,
    paddingHorizontal: 18,
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 19.2,
    elevation: 10,
  },
  dragHandle: {
    width: 172,
    height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 23,
    alignSelf: 'center',
    marginBottom: 34,
  },
  header: {
    // alignItems: 'center',
    paddingLeft: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'rgba(0, 0, 0, 0.25)',
    marginBottom: 24,
    lineHeight: 34,
    letterSpacing: -1,
    paddingTop: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 18,
    padding: 4,
    zIndex: 10,
  },
  scrollContent: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2b2b2b',
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  plateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f5f3f4',
  },
  plateTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    paddingVertical: 12,
  },
  plateTextInputFilled: {
    color: '#e5383b',
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  arrowBtnActive: {
    backgroundColor: '#e5383b',
  },
  arrowBtnInactive: {
    backgroundColor: '#828282',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3f4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#d3d3d3',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 72,
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.16)',
    paddingVertical: 0,
  },
  inputFilled: {
    color: '#000',
  },
  searchBtn: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
    minHeight: 52,
  },
  searchBtnDisabled: {
    opacity: 0.6,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    borderLeftColor: '#e5383b',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2b2b2b',
  },
  vehicleCardWrapper: {
    position: 'relative',
  },
  tapHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#e5383b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tapHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2b2b2b',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#99a2b6',
    textAlign: 'center',
  },
});
