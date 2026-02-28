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
  getVehicles,
  type VehicleResponse,
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

// Search icon
const SearchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35"
      stroke="#666"
      strokeWidth={2}
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
      const result = await getVehicles();
      if (result.success && result.data) {
        // Filter vehicles by plate number (case-insensitive)
        const foundVehicle = result.data.vehicles.find(
          v =>
            v.plateNumber.toLowerCase().trim() ===
            plateNumber.toLowerCase().trim(),
        );

        if (foundVehicle) {
          setVehicle(foundVehicle);
          setError(null);
        } else {
          setError('Vehicle not found with this plate number');
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              style={styles.closeBtn}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Search Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Enter Vehicle Plate Number</Text>
              <View style={styles.searchRow}>
                <View style={styles.inputWrapper}>
                  <SearchIcon />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., MP 09 GL 5656"
                    placeholderTextColor="#999"
                    value={plateNumber}
                    onChangeText={text => {
                      setPlateNumber(text);
                      setError(null);
                    }}
                    autoCapitalize="characters"
                    editable={!isSearching}
                    onSubmitEditing={handleSearch}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.searchBtn,
                    isSearching && styles.searchBtnDisabled,
                  ]}
                  onPress={handleSearch}
                  disabled={isSearching}
                  activeOpacity={0.8}>
                  {isSearching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.searchBtnText}>Search</Text>
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
                <Text style={styles.sectionTitle}>Vehicle Found</Text>
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
                    <Text style={styles.tapHintText}>Tap to continue</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Empty State */}
            {!isSearching && !vehicle && !error && plateNumber.trim() === '' && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Search for a Vehicle</Text>
                <Text style={styles.emptySubtitle}>
                  Enter the vehicle plate number to get started
                </Text>
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
    backgroundColor: '#f5f3f4',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_H * 0.85,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2b2b2b',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
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
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2b2b2b',
    paddingVertical: 12,
  },
  searchBtn: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  searchBtnDisabled: {
    opacity: 0.6,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
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
