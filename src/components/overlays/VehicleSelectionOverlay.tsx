import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import VehicleCard from '../dashboard/VehicleCard';
import {
  searchActiveVehicleVisits,
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
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<VehicleVisitResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VehicleVisitResponse | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (text: string) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchActiveVehicleVisits(text);
      if (res.success && res.data) {
        setSuggestions(res.data.visits);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceTimer.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, search]);

  const handleSelect = (visit: VehicleVisitResponse) => {
    setSelectedVisit(visit);
    setSuggestions([]);
    if (visit.vehicle) {
      setQuery(visit.vehicle.plateNumber);
    }
  };

  const handleConfirm = () => {
    if (!selectedVisit?.vehicle || !onVehicleSelected) return;
    const v = selectedVisit.vehicle;
    const vehicleData: VehicleResponse = {
      id: v.id,
      plateNumber: v.plateNumber,
      brand: v.brand,
      model: v.model,
      year: v.year,
      variant: v.variant,
      chassisNumber: null,
      specs: v.specs,
      registrationName: null,
      ownerName: v.ownerName,
      contactNumber: v.contactNumber,
      email: null,
      gstNumber: null,
      insuranceProvider: null,
      rcCardFrontUrl: null,
      rcCardBackUrl: null,
      odometerReading: null,
      observations: null,
      observationsAudioUrl: null,
      workshopOwnerId: selectedVisit.workshopOwnerId,
      status: 'Active',
      createdAt: selectedVisit.createdAt,
      updatedAt: selectedVisit.updatedAt,
    };
    const vehicleInfo: VehicleInfo = {
      plateNumber: v.plateNumber,
      year: v.year ?? 0,
      make: v.brand ?? '',
      model: v.model ?? '',
      specs: v.specs ?? v.variant ?? '',
    };
    onVehicleSelected(vehicleData, vehicleInfo);
    handleClose();
  };

  const handleClose = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedVisit(null);
    setIsSearching(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    onClose();
  };

  const showDropdown = suggestions.length > 0 && !selectedVisit;

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
          <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.closeBtn}>
            <CloseIcon />
          </TouchableOpacity>

          {/* Header */}
          <Text style={styles.headerTitle}>{title}</Text>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {/* Search Input */}
            <View style={styles.plateInput}>
              <TextInput
                value={query}
                onChangeText={text => {
                  setQuery(text.toUpperCase());
                  if (selectedVisit) setSelectedVisit(null);
                }}
                placeholder="MP 09 GL 5656"
                placeholderTextColor="#c4c4c4"
                style={[styles.plateTextInput, query ? styles.plateTextInputFilled : null]}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => query.length >= 2 ? undefined : undefined}
                disabled={false}
                style={[styles.arrowBtn, query ? styles.arrowBtnActive : styles.arrowBtnInactive]}>
                {isSearching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ArrowRightIcon />
                )}
              </TouchableOpacity>
            </View>

            {/* Hint */}
            {query.length === 0 && (
              <Text style={styles.hint}>Type at least 2 characters to search active vehicles</Text>
            )}

            {/* Dropdown Suggestions */}
            {showDropdown && (
              <View style={styles.dropdown}>
                <FlatList
                  data={suggestions}
                  keyExtractor={item => String(item.id)}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  renderItem={({item}) => {
                    const v = item.vehicle;
                    const name = v
                      ? [v.brand, v.model].filter(Boolean).join(' ')
                      : '';
                    return (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.7}>
                        <View style={styles.suggestionLeft}>
                          <Text style={styles.suggestionPlate}>{v?.plateNumber ?? '—'}</Text>
                          {name ? <Text style={styles.suggestionName}>{name}</Text> : null}
                        </View>
                        <View style={styles.suggestionBadge}>
                          <Text style={styles.suggestionBadgeText}>Active</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {/* No results */}
            {query.length >= 2 && !isSearching && suggestions.length === 0 && !selectedVisit && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No active vehicles found</Text>
                <Text style={styles.emptySubtitle}>No vehicles matching "{query}" are currently in the workshop</Text>
              </View>
            )}

            {/* Selected Vehicle Card */}
            {selectedVisit?.vehicle && (
              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.9}
                style={styles.vehicleCardWrapper}>
                <VehicleCard
                  plateNumber={selectedVisit.vehicle.plateNumber}
                  year={selectedVisit.vehicle.year ?? undefined}
                  make={selectedVisit.vehicle.brand ?? ''}
                  model={selectedVisit.vehicle.model ?? ''}
                  specs={selectedVisit.vehicle.specs ?? selectedVisit.vehicle.variant ?? ''}
                  services={[]}
                  additionalServices={0}
                />
                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Tap to select</Text>
                </View>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_H * 0.85,
    paddingBottom: 40,
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
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 18,
    padding: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.25)',
    marginBottom: 24,
    paddingLeft: 8,
    lineHeight: 34,
    letterSpacing: -1,
    paddingTop: 8,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 12,
  },

  // Input
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
  hint: {
    fontSize: 12,
    color: '#b0b8c8',
    paddingHorizontal: 4,
  },

  // Dropdown
  dropdown: {
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 260,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  suggestionLeft: {
    flex: 1,
    gap: 2,
  },
  suggestionPlate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  suggestionName: {
    fontSize: 12,
    color: '#7a8499',
    fontWeight: '400',
  },
  suggestionBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  suggestionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2e7d32',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2b2b2b',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#99a2b6',
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // Selected card
  selectedCard: {
    borderWidth: 1.5,
    borderColor: '#e5383b',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  selectedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  selectedCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#99a2b6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5383b',
  },
  selectedCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 6,
  },
  selectedPlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plateBadge: {
    backgroundColor: '#f5f3f4',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  plateBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4caf50',
  },
  activeLabel: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
  },
  selectedVehicleName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  selectedOwner: {
    fontSize: 13,
    color: '#7a8499',
  },
  confirmBtn: {
    backgroundColor: '#e5383b',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
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
});
