import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import Svg, {Path, Rect, Circle} from 'react-native-svg';
import FloatingInput from '../ui/FloatingInput';
import VehicleCard from '../dashboard/VehicleCard';
import {createVehicle, gateInVehicle} from '../../services/api';

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
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.dropdownWrap}>
      {!!value && <Text style={styles.dropdownFloatLabel}>{label}</Text>}
      <TouchableOpacity
        onPress={() => !disabled && setOpen(o => !o)}
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
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
              style={styles.dropdownItem}>
              <Text style={styles.dropdownItemText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {error && !value && (
        <Text style={styles.errorText}>Please select {label.toLowerCase()}</Text>
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
  const [problemShared, setProblemShared] = useState('');
  const [vehicleImages, setVehicleImages] = useState<string[]>([]);
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
    setHasAttemptedGateIn(false);
    setIsLoading(false);
    setApiError(null);
    setCreatedVehicleId(null);
  };

  useEffect(() => {
    if (!isOpen) resetAll();
  }, [isOpen]);

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
      const result = await gateInVehicle({
        vehicleId: createdVehicleId,
        gateInDateTime: new Date().toISOString(),
        gateInDriverName: driverName,
        gateInDriverContact: driverContact,
        gateInOdometerReading: odometerReading || undefined,
        gateInFuelLevel: fuelLevel > 0 ? fuelLevel : undefined,
        gateInProblemShared: problemShared || undefined,
      });

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

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* SUCCESS VIEW */}
        {currentView === 'success' && (
          <View style={styles.successOverlay}>
            <View style={styles.successCheck}>
              <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                <Path
                  d="M8 16L14 22L24 10"
                  stroke="#e5383b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.successText}>REQUEST SENT</Text>
          </View>
        )}

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
                  style={styles.plateTextInput}
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
              <TouchableOpacity style={styles.scanBtn}>
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
                <Text style={styles.scanBtnText}>Scan</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.redCard} onPress={() => {}}>
              <View>
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
              <Text style={styles.redCardEmoji}>🪪</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.redCard, {marginTop: 16}]}
              onPress={() => setCurrentView('manual')}>
              <View>
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
              <Text style={styles.redCardEmoji}>🚗</Text>
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
                }}
                error={hasAttemptedManual}
              />
              <DropdownField
                label="Model"
                value={selectedModel}
                options={availableModels}
                onSelect={setSelectedModel}
                disabled={!selectedBrand}
                error={hasAttemptedManual}
              />
              <DropdownField
                label="Year"
                value={selectedYear}
                options={yearOptions}
                onSelect={setSelectedYear}
                error={hasAttemptedManual}
              />
              <DropdownField
                label="Select Variant"
                value={selectedVariant}
                options={variantOptions}
                onSelect={setSelectedVariant}
              />
              <FloatingInput
                label="Vehicle Number"
                value={vehicleNumber}
                onChange={v => setVehicleNumber(v.toUpperCase())}
                required
              />
              {hasAttemptedManual && !vehicleNumber.trim() && (
                <Text style={styles.errorText}>Please enter vehicle number</Text>
              )}
              <FloatingInput
                label="Chassis Number"
                value={chassisNumber}
                onChange={v => setChassisNumber(v.toUpperCase())}
              />

              <TouchableOpacity
                onPress={handleManualNext}
                style={[
                  styles.primaryBtn,
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
              />
              {hasAttemptedSubmit && !registrationName.trim() && (
                <Text style={styles.errorText}>Please enter registration name</Text>
              )}

              <FloatingInput
                label="Owner Name"
                value={ownerName}
                onChange={setOwnerName}
                required
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
              />
              {hasAttemptedSubmit && !contactNumber.trim() && (
                <Text style={styles.errorText}>Please enter contact number</Text>
              )}

              <FloatingInput
                label="Email Id"
                value={email}
                onChange={setEmail}
                keyboardType="email-address"
              />

              {/* GST with Verify */}
              <View style={styles.gstRow}>
                <View style={styles.gstInput}>
                  <FloatingInput
                    label="GST NO."
                    value={gstNumber}
                    onChange={v => {
                      setGstNumber(v.toUpperCase());
                      setIsGstVerified(false);
                    }}
                  />
                </View>
                {isGstVerified ? (
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => gstNumber.trim() && setIsGstVerified(true)}
                    style={styles.verifyBtn}>
                    <Text style={styles.verifyBtnText}>Verify</Text>
                  </TouchableOpacity>
                )}
              </View>

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
              />

              {/* Fuel Level */}
              <View style={styles.fuelContainer}>
                <Text style={styles.fuelLabel}>Fuel Reading</Text>
                <View style={styles.fuelGaugeRow}>
                  <View style={styles.fuelGauge}>
                    <View style={[styles.fuelFill, {flex: Math.max(1, fuelLevel)}]} />
                    <View style={styles.fuelDivider} />
                    <View style={[styles.fuelRemaining, {flex: Math.max(1, 100 - fuelLevel)}]} />
                  </View>
                </View>
                <View style={styles.fuelControls}>
                  <TouchableOpacity
                    onPress={() => setFuelLevel(Math.max(0, fuelLevel - 10))}
                    style={styles.fuelBtn}>
                    <Text style={styles.fuelBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.fuelPct}>{fuelLevel}%</Text>
                  <TouchableOpacity
                    onPress={() => setFuelLevel(Math.min(100, fuelLevel + 10))}
                    style={styles.fuelBtn}>
                    <Text style={styles.fuelBtnText}>+</Text>
                  </TouchableOpacity>
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
                <TouchableOpacity style={styles.recordBtn} activeOpacity={0.8}>
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
                  <Text style={styles.recordBtnText}>Record</Text>
                </TouchableOpacity>
              </View>

              {/* Vehicle Images */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesRow}>
                {vehicleImages.map((_, idx) => (
                  <View key={idx} style={styles.imageThumb}>
                    <View style={styles.imageThumbPlaceholder} />
                    <TouchableOpacity
                      onPress={() =>
                        setVehicleImages(prev => prev.filter((__, i) => i !== idx))
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
                  onPress={() => setVehicleImages(prev => [...prev, `img${prev.length}`])}
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
    maxHeight: '90%',
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
    color: '#e5383b',
    paddingVertical: 12,
  },
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
  formGap: {gap: 14, paddingBottom: 16},
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
  gstRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  gstInput: {flex: 1},
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
    padding: 12,
  },
  fuelLabel: {fontSize: 12, color: '#828282', marginBottom: 8},
  fuelRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  fuelBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#e5383b',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuelBtnText: {color: '#fff', fontSize: 20, fontWeight: '700'},
  fuelBarOuter: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fuelBarInner: {height: '100%', backgroundColor: '#ffad2a', borderRadius: 4},
  fuelPct: {fontSize: 14, fontWeight: '600', color: '#1a1a1a', width: 40, textAlign: 'right'},
  primaryBtn: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {backgroundColor: '#c3c3c3'},
  primaryBtnText: {color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 1},
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e5383b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
  // Fuel gauge visual
  fuelGaugeRow: {marginBottom: 8},
  fuelGauge: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 53,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fuelFill: {height: 53, backgroundColor: '#ffad2a'},
  fuelDivider: {width: 6, height: 33, backgroundColor: '#000000', borderRadius: 3},
  fuelRemaining: {height: 53, backgroundColor: '#f0f0f0'},
  fuelControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
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
});
