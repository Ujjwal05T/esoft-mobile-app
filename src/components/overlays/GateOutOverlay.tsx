import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, {Path} from 'react-native-svg';
import FloatingInput from '../ui/FloatingInput';
import VehicleCard from '../dashboard/VehicleCard';
import {gateOutVehicle, getActiveVehicleVisit} from '../../services/api';

const SCREEN_H = Dimensions.get('screen').height;

interface GateOutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (data: GateOutData) => void;
  vehicleId?: number;
  visitId?: number;
  vehicleData?: {
    plateNumber: string;
    year: number;
    make: string;
    model: string;
    specs: string;
    imageUrl?: string;
  };
}

interface GateOutData {
  driverName: string;
  driverContact: string;
  gateOutDateTime: string;
  odometerReading: string;
  fuelLevel: number;
}

export default function GateOutOverlay({
  isOpen,
  onClose,
  onComplete,
  vehicleId,
  visitId: propVisitId,
  vehicleData,
}: GateOutOverlayProps) {
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [gateOutDate, setGateOutDate] = useState<Date>(new Date());
  const [showGateOutPicker, setShowGateOutPicker] = useState(false);
  const [gateOutPickerMode, setGateOutPickerMode] = useState<'date' | 'time'>('date');
  const [odometerReading, setOdometerReading] = useState('');
  const [fuelLevel, setFuelLevel] = useState(0);
  const [fuelTrackWidth, setFuelTrackWidth] = useState(0);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeVisitId, setActiveVisitId] = useState<number | null>(
    propVisitId || null,
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const successFade = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  const defaultVehicle = {
    plateNumber: 'MP 09 CY 1321',
    year: 2018,
    make: 'Toyota',
    model: 'Crysta',
    specs: '2.4L ZX MT/Diesel',
  };
  const vehicle = vehicleData || defaultVehicle;

  // Reset form when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setDriverName('');
      setDriverContact('');
      setGateOutDate(new Date());
      setShowGateOutPicker(false);
      setOdometerReading('');
      setFuelLevel(0);
      setHasAttemptedSubmit(false);
      setShowSuccess(false);
      setApiError(null);
      setActiveVisitId(propVisitId || null);
    }
  }, [isOpen, propVisitId]);

  // Fetch active visit if vehicleId provided
  useEffect(() => {
    if (isOpen && vehicleId && !propVisitId) {
      const fetchActiveVisit = async () => {
        const result = await getActiveVehicleVisit(vehicleId);
        if (result.success && result.data) {
          setActiveVisitId(result.data.id);
          if (result.data.gateInDriverName) {
            setDriverName(result.data.gateInDriverName);
          }
          if (result.data.gateInDriverContact) {
            setDriverContact(result.data.gateInDriverContact);
          }
        }
      };
      fetchActiveVisit();
    }
  }, [isOpen, vehicleId, propVisitId]);

  // Success animation
  useEffect(() => {
    if (showSuccess) {
      successFade.setValue(0);
      checkScale.setValue(0);
      textFade.setValue(0);
      Animated.parallel([
        Animated.timing(successFade, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(100),
          Animated.spring(checkScale, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(textFade, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      const t = setTimeout(() => onClose(), 1500);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  const handleFuelMove = (evt: any) => {
    if (!fuelTrackWidth) return;
    const x = Math.max(0, Math.min(evt.nativeEvent.locationX, fuelTrackWidth));
    setFuelLevel(Math.round((x / fuelTrackWidth) * 100 / 5) * 5);
  };

  const handleComplete = async () => {
    setHasAttemptedSubmit(true);
    setApiError(null);

    if (!driverName.trim() || !driverContact.trim()) return;

    if (!activeVisitId) {
      setApiError('No active visit found for this vehicle.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await gateOutVehicle(activeVisitId, {
        gateOutDriverName: driverName,
        gateOutDriverContact: driverContact,
        gateOutDateTime: gateOutDate.toISOString(),
        gateOutOdometerReading: odometerReading || undefined,
        gateOutFuelLevel: fuelLevel > 0 ? fuelLevel : undefined,
      });

      if (!result.success) {
        setApiError(result.error || 'Failed to complete gate out');
        return;
      }

      onComplete?.({
        driverName,
        driverContact,
        gateOutDateTime: gateOutDate.toISOString(),
        odometerReading,
        fuelLevel,
      });

      setShowSuccess(true);
    } catch {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = driverName.trim() !== '' && driverContact.trim() !== '';

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        {/* Drag Handle */}
        <View style={styles.handle} />

        {!showSuccess && (
          /* ========== GATE OUT FORM ========== */
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15 19L8 12L15 5"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Gate Out</Text>
            </View>

            {/* Vehicle Card */}
            <View style={styles.vehicleCardWrapper}>
              <VehicleCard
                plateNumber={vehicle.plateNumber}
                year={vehicle.year}
                make={vehicle.make}
                model={vehicle.model}
                specs={vehicle.specs}
                variant="default"
              />
            </View>

            <View style={styles.formGap}>
              {/* Driver's Name */}
              <FloatingInput
                label="Drivers Name"
                value={driverName}
                onChange={setDriverName}
                required
                containerStyle={{borderRadius: 8}}
                wrapperStyle={{margin: 0, paddingBottom: 0, marginBottom: 0}}
              />
              {hasAttemptedSubmit && !driverName.trim() && (
                <Text style={styles.errorText}>
                  Please enter driver&apos;s name
                </Text>
              )}

              {/* Driver's Contact */}
              <FloatingInput
                label="Drivers Contact Number"
                value={driverContact}
                onChange={setDriverContact}
                keyboardType="phone-pad"
                required
                containerStyle={{borderRadius: 8}}
                wrapperStyle={{margin: 0, paddingBottom: 0, marginBottom: 0}}
              />
              {hasAttemptedSubmit && !driverContact.trim() && (
                <Text style={styles.errorText}>
                  Please enter driver&apos;s contact number
                </Text>
              )}

              {/* Gate Out Date and Time */}
              <TouchableOpacity
                style={[styles.dateField, styles.dateFieldActive]}
                onPress={() => {
                  setGateOutPickerMode('date');
                  setShowGateOutPicker(true);
                }}
                activeOpacity={0.7}>
                <Text style={styles.dateFloatLabel}>Gate Out Date and Time</Text>
                <Text style={styles.dateText}>
                  {gateOutDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M6 9L12 15L18 9"
                    stroke="#E5383B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              {showGateOutPicker && (
                <DateTimePicker
                  value={gateOutDate}
                  mode={gateOutPickerMode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, selected) => {
                    if (!selected) { setShowGateOutPicker(false); return; }
                    if (Platform.OS === 'android') {
                      if (gateOutPickerMode === 'date') {
                        const next = new Date(selected);
                        next.setHours(gateOutDate.getHours(), gateOutDate.getMinutes());
                        setGateOutDate(next);
                        setGateOutPickerMode('time');
                      } else {
                        const next = new Date(gateOutDate);
                        next.setHours(selected.getHours(), selected.getMinutes());
                        setGateOutDate(next);
                        setShowGateOutPicker(false);
                      }
                    } else {
                      setGateOutDate(selected);
                    }
                  }}
                />
              )}

              {/* Odometer Reading */}
              <FloatingInput
                label="Odometer Reading"
                value={odometerReading}
                onChange={setOdometerReading}
                keyboardType="numeric"
                containerStyle={{borderRadius: 8}}
                wrapperStyle={{margin: 0, paddingBottom: 0, marginBottom: 0}}
              />

              {/* Fuel Reading Gauge */}
              <View style={styles.fuelContainer}>
                <Text style={styles.fuelFloatLabel}>Fuel Reading</Text>
                <View
                  style={styles.fuelTrack}
                  onLayout={e =>
                    setFuelTrackWidth(e.nativeEvent.layout.width)
                  }
                  onStartShouldSetResponder={() => true}
                  onResponderGrant={handleFuelMove}
                  onResponderMove={handleFuelMove}>
                  {/* Gray background always full width */}
                  <View style={styles.fuelBg} />
                  {/* Orange fill — absolute, no flex reflow */}
                  {fuelTrackWidth > 0 && fuelLevel > 0 && (
                    <View
                      style={[
                        styles.fuelFill,
                        {width: (fuelLevel / 100) * fuelTrackWidth},
                      ]}
                    />
                  )}
                  {/* Black divider at right edge of orange */}
                  {fuelTrackWidth > 0 && fuelLevel > 0 && fuelLevel < 100 && (
                    <View
                      style={[
                        styles.fuelDivider,
                        {left: (fuelLevel / 100) * fuelTrackWidth - 3},
                      ]}
                    />
                  )}
                </View>
              </View>

              {/* API Error */}
              {apiError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{apiError}</Text>
                </View>
              )}

              {/* Complete Button */}
              <TouchableOpacity
                onPress={handleComplete}
                disabled={!isFormValid || isLoading}
                style={[
                  styles.completeBtn,
                  (!isFormValid || isLoading) && styles.disabledBtn,
                ]}>
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.completeBtnText}>PROCESSING...</Text>
                  </View>
                ) : (
                  <Text style={styles.completeBtnText}>COMPLETE</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* SUCCESS VIEW — sibling of sheet so it covers the full screen */}
      {showSuccess && (
        <Animated.View style={[styles.successOverlay, {opacity: successFade}]}>
          <Animated.View
            style={[
              styles.successCheck,
              {opacity: checkScale, transform: [{scale: checkScale}]},
            ]}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 13L9 17L19 7"
                stroke="#e5383b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
          <Animated.Text style={[styles.successText, {opacity: textFade}]}>
            GATE OUT COMPLETE
          </Animated.Text>
        </Animated.View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: SCREEN_H * 0.9,
    overflow: 'hidden',
  },
  handle: {
    width: 172,
    height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 23,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 24,
  },
  backBtn: {padding: 4},
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  vehicleCardWrapper: {marginBottom: 24},
  formGap: {gap: 6, paddingBottom: 16},
  errorText: {fontSize: 12, color: '#e5383b', marginTop: -4},
  // Date field
  dateField: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    marginTop: 8,
  },
  dateFieldActive: {borderColor: '#e5383b'},
  dateFloatLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    fontSize: 10,
    color: '#828282',
    zIndex: 1,
  },
  dateText: {fontSize: 15, color: '#000000', flex: 1},
  // Fuel gauge
  fuelContainer: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 20,
    position: 'relative',
    marginTop: 8,
  },
  fuelFloatLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    fontSize: 10,
    color: '#828282',
    zIndex: 1,
  },
  fuelTrack: {
    height: 53,
    borderRadius: 6,
    position: 'relative',
  },
  fuelBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  fuelFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 53,
    backgroundColor: '#ffad2a',
    borderRadius: 6,
  },
  fuelDivider: {
    position: 'absolute',
    top: 10,
    width: 6,
    height: 33,
    backgroundColor: '#000000',
    borderRadius: 6,
  },
  // Error banner
  errorBanner: {
    backgroundColor: '#ffe0e0',
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    padding: 12,
  },
  errorBannerText: {color: '#e5383b', fontSize: 13},
  // Complete button
  completeBtn: {
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  disabledBtn: {backgroundColor: '#c3c3c3'},
  completeBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Success overlay
  successOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.9,
    backgroundColor: '#e5383b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  successCheck: {
    width: 61,
    height: 61,
    backgroundColor: '#ffffff',
    borderRadius: 30.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  successText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
