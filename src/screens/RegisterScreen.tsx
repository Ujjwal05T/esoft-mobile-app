import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  sendRegistrationOtpByEmail,
  verifyRegistrationOtpByEmail,
  submitWorkshopRegistration,
} from '../services/api';
import FloatingInput from '../components/ui/FloatingInput';
import {DropdownField} from '../components/overlays/AddVehicleOverlay';
import CheckIcon from '../assets/icons/check.svg';

type RegistrationStep =
  | 'enter-credentials'
  | 'verify-otp'
  | 'workshop-details'
  | 'request-sent';

type RegisterMode = 'email' | 'phone';

const OTP_LENGTH = 6;

interface RegisterScreenProps {
  navigation?: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  const [registerMode, setRegisterMode] = useState<RegisterMode>('email');
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('enter-credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  // Step 3
  const [workshopDetails, setWorkshopDetails] = useState({
    fullName: '',
    contactNumber: '',
    aadharNumber: '',
    workshopName: '',
    address: '',
    landmark: '',
    pinCode: '',
    city: '',
    gstNumber: '',
    tradeLicenseNumber: '',
  });
  const [monthlyCapacity, setMonthlyCapacity] = useState<string>('');

  const CAPACITY_OPTIONS = ['1-20', '20-50', '50-70', '70+'];

  const setField = (field: keyof typeof workshopDetails) => (value: string) =>
    setWorkshopDetails(prev => ({...prev, [field]: value}));

  const isEmailValid = email.includes('@') && email.includes('.');
  const isPhoneValid = /^[6-9]\d{9}$/.test(phone);
  const isInputValid = registerMode === 'email' ? isEmailValid : isPhoneValid;
  const isOtpComplete = otp.every(d => d !== '');
  const isWorkshopFormValid =
    workshopDetails.fullName.trim() !== '' &&
    workshopDetails.contactNumber.trim() !== '' &&
    workshopDetails.aadharNumber.trim() !== '' &&
    workshopDetails.workshopName.trim() !== '' &&
    workshopDetails.address.trim() !== '' &&
    workshopDetails.pinCode.trim() !== '' &&
    workshopDetails.city.trim() !== '' &&
    (workshopDetails.gstNumber.trim() !== '' || workshopDetails.tradeLicenseNumber.trim() !== '');

  // ── Handlers ──

  const handleModeSwitch = (mode: RegisterMode) => {
    setRegisterMode(mode);
    setEmail('');
    setPhone('');
    setError('');
  };

  const handleGetOTP = async () => {
    if (!isInputValid) return;
    setError('');
    setLoading(true);
    const result = registerMode === 'email'
      ? await sendRegistrationOtpByEmail(email)
      : await sendRegistrationOtp(phone);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to send OTP. Please try again.');
      return;
    }
    setCurrentStep('verify-otp');
    setTimeout(() => otpRefs.current[0]?.focus(), 200);
  };

  const handleVerifyOTP = async () => {
    if (!isOtpComplete) return;
    setError('');
    setLoading(true);
    const result = registerMode === 'email'
      ? await verifyRegistrationOtpByEmail(email, otp.join(''))
      : await verifyRegistrationOtp(phone, otp.join(''));
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Invalid OTP. Please try again.');
      return;
    }
    // Pre-fill contact number from phone if phone mode
    if (registerMode === 'phone' && phone) {
      setWorkshopDetails(prev => ({...prev, contactNumber: phone}));
    }
    setCurrentStep('workshop-details');
  };

  const handleSendRequest = async () => {
    if (!isWorkshopFormValid) return;
    setError('');
    setLoading(true);
    const result = await submitWorkshopRegistration({
      ownerName: workshopDetails.fullName,
      phoneNumber: registerMode === 'phone' ? phone : workshopDetails.contactNumber,
      email: registerMode === 'email' ? email : (workshopDetails.contactNumber || undefined),
      aadhaarNumber: workshopDetails.aadharNumber,
      workshopName: workshopDetails.workshopName,
      address: workshopDetails.address,
      landmark: workshopDetails.landmark || undefined,
      pinCode: workshopDetails.pinCode,
      city: workshopDetails.city,
      gstNumber: workshopDetails.gstNumber || undefined,
      tradeLicenseNumber: workshopDetails.tradeLicenseNumber || undefined,
      monthlyWorkshopCapacity: monthlyCapacity || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to submit registration. Please try again.');
      return;
    }
    setCurrentStep('request-sent');
  };

  const handleResend = async () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setLoading(true);
    const result = registerMode === 'email'
      ? await sendRegistrationOtpByEmail(email)
      : await sendRegistrationOtp(phone);
    setLoading(false);
    if (result.success) {
      otpRefs.current[0]?.focus();
    } else {
      setError(result.error || 'Failed to resend OTP.');
    }
  };

  const handleBack = () => {
    if (currentStep === 'request-sent') {
      navigation?.navigate('Login');
    } else if (currentStep === 'verify-otp') {
      setCurrentStep('enter-credentials');
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
    } else if (currentStep === 'workshop-details') {
      setCurrentStep('verify-otp');
      setError('');
    } else {
      navigation?.goBack();
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── Render ──

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header with Back Button and Logo */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('../assets/logos/parts_now.png')}
            style={{width: 186, height: 36}}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}>

        {/* Scrollable content */}
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Error at top for workshop-details step only (has many fields) */}
          {!!error && currentStep === 'workshop-details' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Step 1: Enter Credentials */}
          {currentStep === 'enter-credentials' && (
            <View style={styles.stepContent}>
              {/* Mode Toggle */}
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeTab, registerMode === 'email' && styles.modeTabActive]}
                  onPress={() => handleModeSwitch('email')}>
                  <Text style={[styles.modeTabText, registerMode === 'email' && styles.modeTabTextActive]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeTab, registerMode === 'phone' && styles.modeTabActive]}
                  onPress={() => handleModeSwitch('phone')}>
                  <Text style={[styles.modeTabText, registerMode === 'phone' && styles.modeTabTextActive]}>
                    Phone
                  </Text>
                </TouchableOpacity>
              </View>

              {registerMode === 'email' ? (
                <FloatingInput
                  label="Enter Email Address"
                  value={email}
                  onChange={setEmail}
                  keyboardType="email-address"
                  required
                />
              ) : (
                <FloatingInput
                  label="Enter Mobile Number"
                  value={phone}
                  onChange={setPhone}
                  keyboardType="number-pad"
                  maxLength={10}
                  required
                />
              )}

              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          )}

          {/* Step 2: Verify OTP */}
          {currentStep === 'verify-otp' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Verify OTP</Text>
              <Text style={styles.otpSubtitle}>
                {registerMode === 'email'
                  ? `Enter the 6-digit code sent to ${email}`
                  : `Enter the 6-digit code sent to your WhatsApp (+91 ${phone})`}
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => {
                      otpRefs.current[i] = ref;
                    }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={val => handleOtpChange(val, i)}
                    onKeyPress={({nativeEvent}) =>
                      handleOtpKeyPress(nativeEvent.key, i)
                    }
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>

              {/* Error message below form */}
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          )}

          {/* Step 3: Workshop Details */}
          {currentStep === 'workshop-details' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Workshop Details</Text>

              <FloatingInput
                label="Full Name (Required)"
                value={workshopDetails.fullName}
                onChange={setField('fullName')}
                required
              />
              <FloatingInput
                label="Contact Number (Required)"
                value={workshopDetails.contactNumber}
                onChange={setField('contactNumber')}
                keyboardType="phone-pad"
                maxLength={10}
                required
              />
              <FloatingInput
                label="Aadhar Number (Required)"
                value={workshopDetails.aadharNumber}
                onChange={setField('aadharNumber')}
                keyboardType="numeric"
                maxLength={12}
                required
              />
              <FloatingInput
                label="GST Number"
                value={workshopDetails.gstNumber}
                onChange={setField('gstNumber')}
                maxLength={15}
              />
              <FloatingInput
                label="Trade License Number"
                value={workshopDetails.tradeLicenseNumber}
                onChange={setField('tradeLicenseNumber')}
              />
              {workshopDetails.gstNumber.trim() === '' && workshopDetails.tradeLicenseNumber.trim() === '' && (
                <Text style={styles.fieldHint}>Either GST or Trade License Number is required</Text>
              )}
              <FloatingInput
                label="Workshop Name (Required)"
                value={workshopDetails.workshopName}
                onChange={setField('workshopName')}
                required
              />

              {/* Monthly Workshop Capacity Dropdown */}
              <DropdownField
                label="Monthly Workshop Capacity"
                value={monthlyCapacity}
                options={CAPACITY_OPTIONS}
                onSelect={setMonthlyCapacity}
              />

              <FloatingInput
                label="Address (Required)"
                value={workshopDetails.address}
                onChange={setField('address')}
                required
                wrapperStyle={{paddingTop:17}}
              />
              <FloatingInput
                label="Landmark (Optional)"
                value={workshopDetails.landmark}
                onChange={setField('landmark')}
              />
              <FloatingInput
                label="PIN Code (Required)"
                value={workshopDetails.pinCode}
                onChange={setField('pinCode')}
                keyboardType="numeric"
                maxLength={6}
                required
              />
              <FloatingInput
                label="City (Required)"
                value={workshopDetails.city}
                onChange={setField('city')}
                required
              />

            </View>
          )}

          {/* Step 4: Request Sent */}
          {currentStep === 'request-sent' && (
            <View style={styles.successContent}>
              <View style={styles.successCircle}>
                <CheckIcon width={40} height={40} fill="#ffffff" />
              </View>
              <Text style={styles.successTitle}>Request Sent</Text>
              <Text style={styles.successDesc}>
                Our Representative will visit your workshop to verify and get
                you onboarded.
              </Text>
            </View>
          )}

        </ScrollView>

        {/* Fixed Bottom Section — hidden on request-sent */}
        {currentStep !== 'request-sent' && (
          <View style={styles.bottomSection}>

            {currentStep === 'enter-credentials' && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  !(isInputValid && !loading) && styles.actionButtonDisabled,
                ]}
                onPress={handleGetOTP}
                disabled={!isInputValid || loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {'GET OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {currentStep === 'verify-otp' && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  !(isOtpComplete && !loading) && styles.actionButtonDisabled,
                ]}
                onPress={handleVerifyOTP}
                disabled={!isOtpComplete || loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionButtonText}>VERIFY</Text>
                )}
              </TouchableOpacity>
            )}

            {currentStep === 'workshop-details' && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  !(isWorkshopFormValid && !loading) && styles.actionButtonDisabled,
                ]}
                onPress={handleSendRequest}
                disabled={!isWorkshopFormValid || loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionButtonText}>SEND REQUEST</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account ? </Text>
              <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flex1: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
  },
  headerBackArrow: {
    fontSize: 22,
    color: '#1a1a1a',
  },
  headerSearchIcon: {
    fontSize: 22,
    color: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e5383b',
  },
  // Scroll
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Error
  errorBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  // Step content
  stepContent: {
    paddingTop: 12,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#e5383b',
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  // OTP
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  otpBoxFilled: {
    borderColor: '#e5383b',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5383b',
    marginTop: 4,
  },
  demoBox: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#2563eb',
  },
  demoBold: {
    fontWeight: '700',
  },
  // Success
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5383b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#e5383b',
    marginBottom: 16,
  },
  successDesc: {
    fontSize: 16,
    color: '#e5383b',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 26,
  },
  // Bottom
  bottomSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 4,
    paddingTop: 12,
  },
  actionButton: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 1,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: '#666666',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5383b',
  },
  fieldHint: {
    fontSize: 12,
    color: '#e5383b',
    marginTop: -8,
    marginBottom: 4,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 3,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  modeTabTextActive: {
    color: '#e5383b',
    fontWeight: '600',
  },
});

export default RegisterScreen;
