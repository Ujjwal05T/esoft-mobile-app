import React, {useState, useRef, useEffect} from 'react';
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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {sendOtp, verifyOtp} from '../services/otpAuth';
import FloatingInput from '../components/ui/FloatingInput';
import {useAuth} from '../context/AuthContext';

type LoginStep = 'enter-mobile' | 'verify-otp';

const OTP_LENGTH = 6;

interface LoginScreenProps {
  navigation?: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const {signIn} = useAuth();
  const [currentStep, setCurrentStep] = useState<LoginStep>('enter-mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const otpRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const isMobileValid = mobileNumber.length >= 10;
  const isOtpComplete = otp.every(d => d !== '');

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = () => {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGetOTP = async () => {
    if (!isMobileValid) return;
    setError('');
    setLoading(true);
    const result = await sendOtp(mobileNumber);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to send OTP. Please try again.');
      return;
    }
    setCurrentStep('verify-otp');
    startResendTimer();
    setTimeout(() => otpRefs.current[0]?.focus(), 200);
  };

  const handleVerifyOTP = async () => {
    if (!isOtpComplete) return;
    setError('');
    setLoading(true);
    const result = await verifyOtp(mobileNumber, otp.join(''));
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Invalid OTP. Please try again.');
      return;
    }
    if (result.data?.user) {
      signIn(result.data.user);
    }
    navigation?.reset({index: 0, routes: [{name: 'MainTabs'}]});
  };

  const handleBack = () => {
    if (currentStep === 'verify-otp') {
      setCurrentStep('enter-mobile');
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
    } else {
      navigation?.goBack();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    setLoading(true);
    const result = await sendOtp(mobileNumber);
    setLoading(false);
    if (result.success) {
      startResendTimer();
      otpRefs.current[0]?.focus();
    } else {
      setError(result.error || 'Failed to resend OTP.');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack} style={styles.headerIconBtn}>
            <Text style={styles.headerBackArrow}>{'←'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Login</Text>
        </View>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.headerSearchIcon}>⌕</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={0}>

        {/* ── Scrollable Content ── */}
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Step 1: Enter Mobile Number */}
          {currentStep === 'enter-mobile' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Enter Mobile Number</Text>
              <FloatingInput
                label="Enter Mobile Number"
                value={mobileNumber}
                onChange={setMobileNumber}
                keyboardType="phone-pad"
                maxLength={10}
                required
              />
              <Text style={styles.helperText}>
                We'll send you an OTP via WhatsApp to verify your number
              </Text>

              {/* Error message below form */}
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
                Enter the 6-digit code sent to your WhatsApp ({mobileNumber})
              </Text>

              {/* OTP Boxes */}
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

              {/* Resend */}
              <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
                <Text
                  style={[
                    styles.resendLink,
                    resendTimer > 0 && styles.resendDisabled,
                  ]}>
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>

              {/* Demo hint for bypass number (Play Store verification) */}
              {mobileNumber === '7024316744' && (
                <View style={styles.demoBox}>
                  <Text style={styles.demoText}>
                    <Text style={styles.demoBold}>Test Mode:</Text> You can use any 6-digit code (e.g., <Text style={styles.demoBold}>111111</Text>) for verification
                  </Text>
                </View>
              )}

              {/* Error message below form */}
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ── Fixed Bottom Section ── */}
        <View style={styles.bottomSection}>
          {/* Action Button */}
          {currentStep === 'enter-mobile' && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                !(isMobileValid && !loading) && styles.actionButtonDisabled,
              ]}
              onPress={handleGetOTP}
              disabled={!isMobileValid || loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>GET OTP</Text>
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
                <Text style={styles.actionButtonText}>LOGIN</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account ? </Text>
            <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
  // Content
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
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
  stepContent: {
    flex: 1,
    paddingTop: 12,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#e5383b',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  // OTP
  otpSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
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
  resendDisabled: {
    color: '#9ca3af',
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
  // Bottom
  bottomSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
    color: '#666666',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5383b',
  },
});

export default LoginScreen;
