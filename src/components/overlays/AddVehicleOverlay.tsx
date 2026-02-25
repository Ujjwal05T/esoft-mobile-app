import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

const SCREEN_H = Dimensions.get('screen').height;
import Svg, {Path, Rect, Circle} from 'react-native-svg';
import FloatingInput from '../ui/FloatingInput';
import VehicleCard from '../dashboard/VehicleCard';
import {createVehicle, gateInVehicle, gateInVehicleWithMedia, scanRcCard, scanVehiclePlate} from '../../services/api';
import CameraScannerOverlay, {ScanMode} from './CameraScannerOverlay';

export interface VehicleRequestFormData {
  plateNumber: string;
  ownerName: string;
  contactNumber: string;
  odometerReading: string;
  observations: string;
  brand?: string;
  model?: string;
  year?: string;
  variant?: string;
  chassisNumber?: string;
}

interface VehicleData {
  plateNumber: string;
  year: number;
  make: string;
  model: string;
  specs: string;
}

interface AddVehicleOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest?: (data: VehicleRequestFormData) => void;
}

const brandOptions = ['Toyota', 'Honda', 'Hyundai', 'Maruti Suzuki', 'Tata', 'Mahindra', 'Kia'];
const modelOptions: Record<string, string[]> = {
  Toyota: ['Innova', 'Innova Crysta', 'Fortuner', 'Glanza'],
  Honda: ['City', 'Amaze', 'Elevate'],
  Hyundai: ['Creta', 'Venue', 'i20'],
  'Maruti Suzuki': ['Swift', 'Baleno', 'Brezza'],
  Tata: ['Nexon', 'Punch', 'Harrier'],
  Mahindra: ['XUV500', 'Thar', 'Scorpio'],
  Kia: ['Seltos', 'Sonet', 'Carens'],
};
const yearOptions = Array.from({length: 15}, (_, i) => String(2024 - i));
const variantOptions = ['Crysta CX', 'Crysta VX', 'Crysta ZX', 'Base', 'Mid', 'Top'];
const insuranceOptions = [
  'ICICI Lombard',
  'HDFC ERGO',
  'Bajaj Allianz',
  'New India Assurance',
  'United India Insurance',
  'National Insurance',
];

// Simple inline dropdown component
function DropdownField({
  label,
  value,
  options,
  onSelect,
  disabled,
  error,
  isOpen: externalOpen,
  onToggle,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  disabled?: boolean;
  error?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;

  const handleToggle = () => {
    if (disabled) return;
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(o => !o);
    }
  };

  const handleSelect = (opt: string) => {
    onSelect(opt);
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(false);
    }
  };

  return (
    <View style={styles.dropdownWrap}>
      {!!value && <Text style={styles.dropdownFloatLabel}>{label}</Text>}
      <TouchableOpacity
        onPress={handleToggle}
        style={[
          styles.dropdown,
          value ? styles.dropdownActive : null,
          error && !value ? styles.dropdownError : null,
          disabled ? styles.dropdownDisabled : null,
        ]}
        activeOpacity={0.8}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || label}
        </Text>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d={open ? 'M17 14L12 9L7 14' : 'M7 10L12 15L17 10'}
            stroke="#828282"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => handleSelect(opt)}
              style={styles.dropdownItem}>
              <Text style={styles.dropdownItemText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AddVehicleOverlay({
  isOpen,
  onClose,
  onSubmitRequest,
}: AddVehicleOverlayProps) {
  type ViewType = 'search' | 'manual' | 'form' | 'gatein' | 'success';
  const [currentView, setCurrentView] = useState<ViewType>('search');

  // Camera scanner
  const [scanMode, setScanMode] = useState<ScanMode | null>(null);
  const [isScanProcessing, setIsScanProcessing] = useState(false);

  // Manual view — which dropdown is currently open
  const [openManualDropdown, setOpenManualDropdown] = useState<string | null>(null);
  const toggleManualDropdown = (id: string) =>
    setOpenManualDropdown(prev => (prev === id ? null : id));

  // Search
  const [plateNumber, setPlateNumber] = useState('');

  // Manual
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [hasAttemptedManual, setHasAttemptedManual] = useState(false);

  // Form (owner details)
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [registrationName, setRegistrationName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [isGstVerified, setIsGstVerified] = useState(false);
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Gate In
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [gateInDateTime, setGateInDateTime] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [fuelLevel, setFuelLevel] = useState(0);
  const [fuelTrackWidth, setFuelTrackWidth] = useState(0);
  const [problemShared, setProblemShared] = useState('');
  const [vehicleImages, setVehicleImages] = useState<{uri: string; name: string; type: string}[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioPath, setRecordedAudioPath] = useState<string | null>(null);
  const audioRecorderPlayer = useRef(AudioRecorderPlayer);
  const successFade = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const [hasAttemptedGateIn, setHasAttemptedGateIn] = useState(false);

  // API state
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdVehicleId, setCreatedVehicleId] = useState<number | null>(null);

  const availableModels = selectedBrand ? (modelOptions[selectedBrand] || []) : [];

  const resetAll = () => {
    setCurrentView('search');
    setPlateNumber('');
    setVehicleData(null);
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedYear('');
    setSelectedVariant('');
    setVehicleNumber('');
    setChassisNumber('');
    setHasAttemptedManual(false);
    setRegistrationName('');
    setOwnerName('');
    setContactNumber('');
    setEmail('');
    setGstNumber('');
    setIsGstVerified(false);
    setInsuranceProvider('');
    setHasAttemptedSubmit(false);
    setDriverName('');
    setDriverContact('');
    setGateInDateTime('');
    setOdometerReading('');
    setFuelLevel(0);
    setProblemShared('');
    setVehicleImages([]);
    setIsRecording(false);
    setRecordedAudioPath(null);
    audioRecorderPlayer.current.stopRecorder().catch(() => {});
    setHasAttemptedGateIn(false);
    setIsLoading(false);
    setApiError(null);
    setCreatedVehicleId(null);
    setScanMode(null);
    setIsScanProcessing(false);
  };

  useEffect(() => {
    if (!isOpen) resetAll();
  }, [isOpen]);

  useEffect(() => {
    if (currentView === 'success') {
      successFade.setValue(0);
      checkScale.setValue(0);
      textFade.setValue(0);
      Animated.parallel([
        Animated.timing(successFade, {
          toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(100),
          Animated.spring(checkScale, {
            toValue: 1, friction: 4, tension: 40, useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(textFade, {
            toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'success') {
      const t = setTimeout(() => onClose(), 1500);
      return () => clearTimeout(t);
    }
  }, [currentView, onClose]);

  const handleSubmitPlate = () => {
    if (plateNumber.trim()) {
      setVehicleData({
        plateNumber: plateNumber.trim(),
        year: 2018,
        make: 'Toyota',
        model: 'Crysta',
        specs: '2.4L ZX MT/Diesel',
      });
      setCurrentView('form');
    }
  };

  const handleManualNext = () => {
    setHasAttemptedManual(true);
    if (!selectedBrand || !selectedModel || !selectedYear || !vehicleNumber.trim()) return;
    setVehicleData({
      plateNumber: vehicleNumber.trim(),
      year: parseInt(selectedYear),
      make: selectedBrand,
      model: selectedModel,
      specs: selectedVariant || 'Standard',
    });
    setCurrentView('form');
  };

  const handleBack = () => {
    if (currentView === 'gatein') {
      setCurrentView('form');
    } else if (currentView === 'form') {
      if (selectedBrand && selectedModel) {
        setCurrentView('manual');
      } else {
        setCurrentView('search');
      }
      setVehicleData(null);
      setHasAttemptedSubmit(false);
    } else if (currentView === 'manual') {
      setCurrentView('search');
      setHasAttemptedManual(false);
    } else {
      onClose();
    }
  };

  const handleSendRequest = async () => {
    setHasAttemptedSubmit(true);
    setApiError(null);
    if (!registrationName.trim() || !ownerName.trim() || !contactNumber.trim()) return;
    if (!vehicleData) return;

    setIsLoading(true);
    try {
      const result = await createVehicle({
        plateNumber: vehicleData.plateNumber,
        brand: selectedBrand || vehicleData.make || undefined,
        model: selectedModel || vehicleData.model || undefined,
        year: selectedYear ? parseInt(selectedYear) : vehicleData.year || undefined,
        variant: selectedVariant || undefined,
        chassisNumber: chassisNumber || undefined,
        specs: vehicleData.specs || undefined,
        registrationName,
        ownerName,
        contactNumber,
        email: email || undefined,
        gstNumber: gstNumber || undefined,
        insuranceProvider: insuranceProvider || undefined,
      });

      if (!result.success) {
        setApiError(result.error || 'Failed to create vehicle');
        return;
      }

      setCreatedVehicleId(result.data!.id);
      onSubmitRequest?.({
        plateNumber: vehicleData.plateNumber,
        ownerName,
        contactNumber,
        odometerReading: '',
        observations: '',
        brand: selectedBrand || undefined,
        model: selectedModel || undefined,
        year: selectedYear || undefined,
        variant: selectedVariant || undefined,
        chassisNumber: chassisNumber || undefined,
      });
      setDriverContact(contactNumber);
      setCurrentView('gatein');
    } catch {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGateIn = async () => {
    setHasAttemptedGateIn(true);
    setApiError(null);
    if (!driverName.trim() || !driverContact.trim()) return;
    if (!createdVehicleId) {
      setApiError('Vehicle not created. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const visitData = {
        vehicleId: createdVehicleId,
        gateInDateTime: new Date().toISOString(),
        gateInDriverName: driverName,
        gateInDriverContact: driverContact,
        gateInOdometerReading: odometerReading || undefined,
        gateInFuelLevel: fuelLevel > 0 ? fuelLevel : undefined,
        gateInProblemShared: problemShared || undefined,
      };

      const audioFile = recordedAudioPath
        ? {uri: recordedAudioPath, name: `problem_audio_${Date.now()}.mp4`, type: 'audio/mp4'}
        : undefined;

      const result =
        audioFile || vehicleImages.length > 0
          ? await gateInVehicleWithMedia(visitData, audioFile, vehicleImages.length > 0 ? vehicleImages : undefined)
          : await gateInVehicle(visitData);

      if (!result.success) {
        setApiError(result.error || 'Failed to gate in vehicle');
        return;
      }
      setCurrentView('success');
    } catch {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = (title: string) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke="#000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );

  const handleFuelMove = (evt: any) => {
    if (!fuelTrackWidth) return;
    const x = Math.max(0, Math.min(evt.nativeEvent.locationX, fuelTrackWidth));
    setFuelLevel(Math.round((x / fuelTrackWidth) * 100 / 5) * 5);
  };

  const handlePickImage = () => {
    launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 10}, response => {
      if (!response.didCancel && !response.errorCode && response.assets?.length) {
        const newImages = response.assets
          .filter(a => a.uri)
          .map(a => ({
            uri: a.uri!,
            name: a.fileName || `photo_${Date.now()}.jpg`,
            type: a.type || 'image/jpeg',
          }));
        setVehicleImages(prev => [...prev, ...newImages]);
      }
    });
  };

  const handleRecord = async () => {
    if (isRecording) {
      const path = await audioRecorderPlayer.current.stopRecorder();
      audioRecorderPlayer.current.removeRecordBackListener();
      setRecordedAudioPath(path);
      setIsRecording(false);
    } else {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      setRecordedAudioPath(null);
      await audioRecorderPlayer.current.startRecorder();
      setIsRecording(true);
    }
  };

  const handleScanCapture = async (uri: string) => {
    try {
      const currentScanMode = scanMode;

      // Start processing - keep scanner open with animation
      setIsScanProcessing(true);

      // Convert image URI to base64
      const base64Image = await RNFS.readFile(uri, 'base64');

      // Call OCR API based on scan mode
      const ocrResult = currentScanMode === 'rc'
        ? await scanRcCard(base64Image)
        : await scanVehiclePlate(base64Image);

      // Stop processing and close scanner
      setIsScanProcessing(false);
      setScanMode(null);

      if (ocrResult.success) {
        // Auto-populate form fields with OCR results
        if (ocrResult?.data?.plateNumber) {
          setPlateNumber(ocrResult?.data?.plateNumber);
          setVehicleNumber(ocrResult?.data?.plateNumber);
        }
        if (ocrResult?.data?.vehicleBrand) {
          setSelectedBrand(ocrResult?.data?.vehicleBrand);
        }
        if (ocrResult?.data?.vehicleModel) {
          setSelectedModel(ocrResult?.data?.vehicleModel);
        }
        if (ocrResult?.data?.year) {
          setSelectedYear(ocrResult?.data?.year?.toString());
        }
        if (ocrResult?.data?.variant) {
          setSelectedVariant(ocrResult?.data?.variant);
        }
        if (ocrResult?.data?.chassisNumber) {
          setChassisNumber(ocrResult?.data?.chassisNumber);
        }
        if (ocrResult?.data?.ownerName) {
          setOwnerName(ocrResult?.data?.ownerName);
          setRegistrationName(ocrResult?.data?.ownerName);
        }

        // Show success message
        Alert.alert(
          'Success',
          currentScanMode === 'rc'
            ? 'RC card scanned successfully! Fields have been auto-filled.'
            : 'Number plate scanned successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Switch to appropriate view based on what was scanned
                if (currentScanMode === 'rc') {
                  setCurrentView('manual'); // Show manual view to review/edit details
                } else {
                  // For plate scan, stay in search view so user can proceed
                  setCurrentView('search');
                }
              },
            },
          ]
        );
      } else {
        // Show error message
        Alert.alert(
          'Scan Failed',
          ocrResult?.error || 'Could not read the document. Please try again with a clearer image.',
          [
            {text: 'Retry', onPress: () => {
              setIsScanProcessing(false);
              setScanMode(currentScanMode);
            }},
            {text: 'Cancel', style: 'cancel'},
          ]
        );
      }
    } catch (error) {
      setIsScanProcessing(false);
      setScanMode(null);
      console.error('Error processing scanned image:', error);
      Alert.alert(
        'Error',
        'Failed to process the image. Please try again.',
        [
          {text: 'Retry', onPress: () => setScanMode(scanMode)},
          {text: 'Cancel', style: 'cancel'},
        ]
      );
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* SEARCH VIEW */}
        {currentView === 'search' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.bigTitle}>Add by Car Number{'\n'}Plate</Text>

            <View style={styles.searchRow}>
              <View style={styles.plateInput}>
                <TextInput
                  value={plateNumber}
                  onChangeText={v => setPlateNumber(v.toUpperCase())}
                  placeholder="MP 09 GL 5656"
                  placeholderTextColor="#c4c4c4"
                  style={[styles.plateTextInput, plateNumber ? styles.plateTextInputFilled : null]}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  onPress={handleSubmitPlate}
                  style={[styles.arrowBtn, plateNumber ? styles.arrowBtnActive : styles.arrowBtnInactive]}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.scanBtn} onPress={() => setScanMode('plate')}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 7V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H7M17 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V7M21 17V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H17M7 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V17"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Rect x="7" y="7" width="4" height="4" rx="1" fill="white" />
                  <Rect x="13" y="7" width="4" height="4" rx="1" fill="white" />
                  <Rect x="7" y="13" width="4" height="4" rx="1" fill="white" />
                </Svg>
                <Text style={styles.scanBtnText}>Scan Number</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.redCard, {overflow: 'hidden'}]} onPress={() => setScanMode('rc')}>
              <View style={{zIndex: 1}}>
                <Text style={styles.redCardTitle}>Scan RC{'\n'}Card</Text>
                <View style={styles.diagonalArrow}>
                  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                    <Circle cx="16" cy="16" r="15" stroke="white" strokeWidth="2" />
                    <Path
                      d="M11 21L21 11M21 11H13M21 11V19"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
              <Image
                source={require('../../assets/images/rc-card.png')}
                style={styles.redCardImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.redCard, {marginTop: 16, overflow: 'hidden'}]}
              onPress={() => setCurrentView('manual')}>
              <View style={{zIndex: 1}}>
                <Text style={styles.redCardTitle}>Add Vehicle{'\n'}Manually</Text>
                <View style={styles.diagonalArrow}>
                  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                    <Circle cx="16" cy="16" r="15" stroke="white" strokeWidth="2" />
                    <Path
                      d="M11 21L21 11M21 11H13M21 11V19"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
              <Image
                source={require('../../assets/images/car-suv.png')}
                style={styles.carSuvImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* MANUAL VIEW */}
        {currentView === 'manual' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderHeader('Add Vehicle Details')}
            <View style={styles.formGap}>
              <DropdownField
                label="Brand"
                value={selectedBrand}
                options={brandOptions}
                onSelect={v => {
                  setSelectedBrand(v);
                  setSelectedModel('');
                  setOpenManualDropdown(null);
                }}
                error={hasAttemptedManual}
                isOpen={openManualDropdown === 'brand'}
                onToggle={() => toggleManualDropdown('brand')}
              />
              <DropdownField
                label="Model"
                value={selectedModel}
                options={availableModels}
                onSelect={setSelectedModel}
                disabled={!selectedBrand}
                error={hasAttemptedManual}
                isOpen={openManualDropdown === 'model'}
                onToggle={() => toggleManualDropdown('model')}
              />
              <DropdownField
                label="Year"
                value={selectedYear}
                options={yearOptions}
                onSelect={setSelectedYear}
                error={hasAttemptedManual}
                isOpen={openManualDropdown === 'year'}
                onToggle={() => toggleManualDropdown('year')}
              />
              <DropdownField
                label="Select Variant"
                value={selectedVariant}
                options={variantOptions}
                onSelect={setSelectedVariant}
                isOpen={openManualDropdown === 'variant'}
                onToggle={() => toggleManualDropdown('variant')}
              />
              <FloatingInput
                label="Vehicle Number"
                value={vehicleNumber}
                onChange={v => setVehicleNumber(v.toUpperCase())}
                required
                containerStyle={{borderRadius: 8}}
                wrapperStyle={{marginBottom:0}}
              />
              <FloatingInput
                label="Chassis Number"
                value={chassisNumber}
                onChange={v => setChassisNumber(v.toUpperCase())}
                containerStyle={{borderRadius: 8}}
                wrapperStyle={{marginBottom: 8}}
              />

              <TouchableOpacity
                onPress={handleManualNext}
                style={[
                  styles.primaryBtn,
                  {marginTop: 8},
                  !(selectedBrand && selectedModel && selectedYear && vehicleNumber.trim()) &&
                    styles.disabledBtn,
                ]}>
                <Text style={styles.primaryBtnText}>NEXT</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* FORM VIEW (Owner Details) */}
        {currentView === 'form' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderHeader('Add New Vehicle')}
            {vehicleData && (
              <View style={styles.vehicleCardWrapper}>
                <VehicleCard
                  plateNumber={vehicleData.plateNumber}
                  year={vehicleData.year}
                  make={vehicleData.make}
                  model={vehicleData.model}
                  specs={vehicleData.specs}
                  variant="default"
                />
              </View>
            )}
            <View style={styles.formGap}>
              {apiError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{apiError}</Text>
                </View>
              ) : null}

              <FloatingInput
                label="Registration Name"
                value={registrationName}
                onChange={setRegistrationName}
                required
                containerStyle={{borderRadius:8}}
                wrapperStyle={{margin:0,paddingBottom:0,marginBottom:0,marginTop:0}}
              />
              {hasAttemptedSubmit && !registrationName.trim() && (
                <Text style={styles.errorText}>Please enter registration name</Text>
              )}

              <FloatingInput
                label="Owner Name"
                value={ownerName}
                onChange={setOwnerName}
                required
                containerStyle={{borderRadius:8}}
                 wrapperStyle={{margin:0,paddingBottom:0,marginBottom:0,marginTop:0}} 
              />
              {hasAttemptedSubmit && !ownerName.trim() && (
                <Text style={styles.errorText}>Please enter owner name</Text>
              )}

              <FloatingInput
                label="Contact Number"
                value={contactNumber}
                onChange={setContactNumber}
                keyboardType="phone-pad"
                required
                containerStyle={{borderRadius:8}}
                wrapperStyle={{margin:0,paddingBottom:0,marginBottom:0}}
              />
              {hasAttemptedSubmit && !contactNumber.trim() && (
                <Text style={styles.errorText}>Please enter contact number</Text>
              )}

              <FloatingInput
                label="Email Id"
                value={email}
                onChange={setEmail}
                keyboardType="email-address"
                  containerStyle={{borderRadius:8}}
                  wrapperStyle={{margin:0,paddingBottom:0,marginBottom:0}}
              />

              {/* GST with Verify */}
              <FloatingInput
                label="GST NO."
                value={gstNumber}
                onChange={v => {
                  setGstNumber(v.toUpperCase());
                  setIsGstVerified(false);
                }}
                containerStyle={{borderRadius: 8}}
                wrapperStyle={{margin: 0, paddingBottom: 0, marginBottom: 8}}
                rightElement={
                  isGstVerified ? (
                    <Text style={styles.verifiedText}>VERIFIED</Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => gstNumber.trim() && setIsGstVerified(true)}
                      style={styles.verifyBtn}>
                      <Text style={styles.verifyBtnText}>Verify</Text>
                    </TouchableOpacity>
                  )
                }
              />

              <DropdownField
                label="Insurance Provider"
                value={insuranceProvider}
                options={insuranceOptions}
                onSelect={setInsuranceProvider}
              />

              <TouchableOpacity
                onPress={handleSendRequest}
                disabled={
                  !registrationName.trim() ||
                  !ownerName.trim() ||
                  !contactNumber.trim() ||
                  isLoading
                }
                style={[
                  styles.primaryBtn,
                  {marginTop: 8},
                  (!registrationName.trim() ||
                    !ownerName.trim() ||
                    !contactNumber.trim()) &&
                    styles.disabledBtn,
                ]}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>PROCEED TO GATE IN</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* GATE IN VIEW */}
        {currentView === 'gatein' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderHeader('Gate In')}
            <View style={styles.formGap}>
              {apiError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{apiError}</Text>
                </View>
              ) : null}

              <FloatingInput
                label="Driver's Name"
                value={driverName}
                onChange={setDriverName}
                required
                containerStyle={{borderRadius: 8}}
              />
              {hasAttemptedGateIn && !driverName.trim() && (
                <Text style={styles.errorText}>Please enter driver's name</Text>
              )}

              <FloatingInput
                label="Driver's Contact Number"
                value={driverContact}
                onChange={setDriverContact}
                keyboardType="phone-pad"
                required
                containerStyle={{borderRadius: 8}}
              />
              {hasAttemptedGateIn && !driverContact.trim() && (
                <Text style={styles.errorText}>Please enter driver's contact number</Text>
              )}

              {/* Gate In Date and Time */}
              <View style={[styles.dropdownWrap, styles.dropdown, !!gateInDateTime && styles.dropdownActive]}>
                {!!gateInDateTime && (
                  <Text style={styles.dropdownFloatLabel}>Gate In Date and time</Text>
                )}
                <TextInput
                  value={gateInDateTime || new Date().toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true,
                  })}
                  onChangeText={setGateInDateTime}
                  placeholder="Gate In Date and time"
                  placeholderTextColor="#828282"
                  style={styles.gateInDateInput}
                />
              </View>

              <FloatingInput
                label="Odometer Reading"
                value={odometerReading}
                onChange={setOdometerReading}
                keyboardType="numeric"
                containerStyle={{borderRadius: 8}}
              />

              {/* Fuel Level */}
              <View style={styles.fuelContainer}>
                <Text style={styles.fuelFloatLabel}>Fuel Reading</Text>
                <View
                  style={styles.fuelTrack}
                  onLayout={e => setFuelTrackWidth(e.nativeEvent.layout.width)}
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

              {/* Problem Shared with Record button */}
              <View style={[styles.dropdown, !!problemShared && styles.dropdownActive, styles.problemRow]}>
                <TextInput
                  value={problemShared}
                  onChangeText={setProblemShared}
                  placeholder="Problem Shared"
                  placeholderTextColor="#828282"
                  style={styles.problemInput}
                />
                <TouchableOpacity
                  onPress={handleRecord}
                  style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                  activeOpacity={0.8}>
                  {isRecording ? (
                    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                      <Rect x="5" y="5" width="10" height="10" rx="2" fill="white" />
                    </Svg>
                  ) : (
                    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                      <Path
                        d="M10 12.5C11.38 12.5 12.5 11.38 12.5 10V5C12.5 3.62 11.38 2.5 10 2.5C8.62 2.5 7.5 3.62 7.5 5V10C7.5 11.38 8.62 12.5 10 12.5Z"
                        stroke="#e5383b"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M4.167 8.333V10C4.167 13.222 6.778 15.833 10 15.833C13.222 15.833 15.833 13.222 15.833 10V8.333"
                        stroke="#e5383b"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M10 15.833V17.5"
                        stroke="#e5383b"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                  <Text style={[styles.recordBtnText, isRecording && styles.recordBtnTextActive]}>
                    {isRecording ? 'Stop' : recordedAudioPath ? 'Re-record' : 'Record'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Recorded audio chip */}
              {recordedAudioPath && !isRecording && (
                <View style={styles.audioChip}>
                  <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
                    <Path
                      d="M10 12.5C11.38 12.5 12.5 11.38 12.5 10V5C12.5 3.62 11.38 2.5 10 2.5C8.62 2.5 7.5 3.62 7.5 5V10C7.5 11.38 8.62 12.5 10 12.5Z"
                      stroke="#16a34a"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M4.167 8.333V10C4.167 13.222 6.778 15.833 10 15.833C13.222 15.833 15.833 13.222 15.833 10V8.333"
                      stroke="#16a34a"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.audioChipText}>Problem audio recorded</Text>
                  <TouchableOpacity onPress={() => setRecordedAudioPath(null)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Text style={styles.audioChipRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Vehicle Images */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesRow}>
                {vehicleImages.map((img, idx) => (
                  <View key={idx} style={styles.imageThumb}>
                    <Image source={{uri: img.uri}} style={styles.imageThumbFill} resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() =>
                        setVehicleImages(prev => prev.filter((_, i) => i !== idx))
                      }
                      style={styles.imageDeleteBtn}
                      activeOpacity={0.8}>
                      <Svg width={12} height={14} viewBox="0 0 12 14" fill="none">
                        <Path
                          d="M1 3.5H11M4.5 6V10.5M7.5 6V10.5M2 3.5L2.5 11.5C2.5 12.052 2.948 12.5 3.5 12.5H8.5C9.052 12.5 9.5 12.052 9.5 11.5L10 3.5M4 3.5V2C4 1.448 4.448 1 5 1H7C7.552 1 8 1.448 8 2V3.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.imageAddBtn}
                  onPress={handlePickImage}
                  activeOpacity={0.8}>
                  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                    <Path
                      d="M16 8V24M8 16H24"
                      stroke="#E5383B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity
                onPress={handleGateIn}
                disabled={!driverName.trim() || !driverContact.trim() || isLoading}
                style={[
                  styles.primaryBtn,
                  {marginTop: 8},
                  (!driverName.trim() || !driverContact.trim()) && styles.disabledBtn,
                ]}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>GATE IN</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* SUCCESS VIEW — sibling of sheet so it isn't constrained by sheet's collapsed height */}
      {currentView === 'success' && (
        <Animated.View style={[styles.successOverlay, {opacity: successFade}]}>
          <Animated.View
            style={[
              styles.successCheck,
              {opacity: checkScale, transform: [{scale: checkScale}]},
            ]}>
            <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
              <Path
                d="M8 16L14 22L24 10"
                stroke="#e5383b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
          <Animated.Text style={[styles.successText, {opacity: textFade}]}>
            REQUEST SENT
          </Animated.Text>
        </Animated.View>
      )}

      {/* Camera scanner — rendered inside the Modal so it fills the screen */}
      {scanMode !== null && (
        <CameraScannerOverlay
          visible={scanMode !== null}
          mode={scanMode}
          onCapture={handleScanCapture}
          onClose={() => {
            setIsScanProcessing(false);
            setScanMode(null);
          }}
          isProcessing={isScanProcessing}
        />
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 18,
    paddingBottom: 32,
    maxHeight: SCREEN_H * 0.9,
  },
  handle: {
    width: 172,
    height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {padding: 4},
  headerTitle: {fontSize: 22, fontWeight: '600', color: '#000'},
  bigTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.25)',
    marginBottom: 24,
    lineHeight: 34,
    letterSpacing: -1,
    paddingTop: 8,
  },
  searchRow: {flexDirection: 'row', gap: 10, marginBottom: 24},
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
  plateTextInputFilled: {color: '#e5383b'},
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  arrowBtnActive: {backgroundColor: '#e5383b'},
  arrowBtnInactive: {backgroundColor: '#828282'},
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e5383b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  scanBtnText: {color: '#fff', fontSize: 14},
  redCard: {
    backgroundColor: '#e5383b',
    borderRadius: 13,
    padding: 20,
    minHeight: 155,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  redCardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 32,
    marginBottom: 12,
  },
  diagonalArrow: {},
  redCardEmoji: {fontSize: 64, opacity: 0.9},
  redCardImage: {position: 'absolute', right: -1, top: 30, width: 200, height: 140, opacity: 0.9},
  carSuvImage: {position: 'absolute', right: -90, top: -1, width: 280, height: 200, opacity: 0.9},
  formGap: {gap: 6, paddingBottom: 16},
  vehicleCardWrapper: {marginBottom: 16},
  dropdown: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownActive: {borderColor: '#e5383b'},
  dropdownError: {borderColor: '#e5383b', backgroundColor: '#ffe0e0'},
  dropdownDisabled: {opacity: 0.5},
  dropdownText: {fontSize: 15, color: '#000'},
  dropdownPlaceholder: {color: '#828282'},
  dropdownList: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {fontSize: 14, color: '#000'},
  errorText: {fontSize: 12, color: '#e5383b', marginTop: -8},
  errorBanner: {
    backgroundColor: '#ffe0e0',
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    padding: 12,
  },
  errorBannerText: {color: '#e5383b', fontSize: 14},
  verifiedText: {fontSize: 14, fontWeight: '700', color: '#e5383b'},
  verifyBtn: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  verifyBtnText: {color: '#fff', fontSize: 14, fontWeight: '600'},
  fuelContainer: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 20,
    position: 'relative',
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
  primaryBtn: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {backgroundColor: '#d3d3d3'},
  primaryBtnText: {color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 1},
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
    backgroundColor: '#fff',
    borderRadius: 30.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  successText: {color: '#fff', fontSize: 20, fontWeight: '500', letterSpacing: 1},
  // Dropdown floating label
  dropdownWrap: {position: 'relative'},
  dropdownFloatLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    fontSize: 10,
    color: '#828282',
    zIndex: 1,
  },
  // Gate In Date input
  gateInDateInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    padding: 0,
  },
  // Problem Shared row
  problemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  problemInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    padding: 0,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recordBtnText: {fontSize: 14, fontWeight: '500', color: '#e5383b'},
  // Vehicle images
  imagesRow: {flexDirection: 'row', gap: 12, paddingBottom: 4},
  imageThumb: {
    width: 100,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbPlaceholder: {
    width: 100,
    height: 80,
    backgroundColor: '#d3d3d3',
  },
  imageDeleteBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    backgroundColor: '#e5383b',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageAddBtn: {
    width: 100,
    height: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d3d3d3',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageThumbFill: {
    width: 100,
    height: 80,
  },
  recordBtnActive: {
    backgroundColor: '#e5383b',
    borderColor: '#e5383b',
  },
  recordBtnTextActive: {
    color: '#fff',
  },
  audioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: -2,
  },
  audioChipText: {fontSize: 12, color: '#16a34a', fontWeight: '500'},
  audioChipRemove: {fontSize: 12, color: '#16a34a', fontWeight: '700'},
});
