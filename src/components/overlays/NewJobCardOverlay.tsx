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
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Svg, {Path, Rect} from 'react-native-svg';
import {
  createJobCard,
  createJobCardWithMedia,
  getStaff,
  type CreateJobCardData,
  type WorkshopStaffResponse,
} from '../../services/api';

const SCREEN_H = Dimensions.get('screen').height;
const MAX_IMAGES = 3;

interface NewJobCardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob?: (data: CreateJobCardData) => void;
  vehicleId: number;
}

interface StaffMember {
  id: string;
  name: string;
}

const jobCategories = [
  {id: '1', name: 'General Service', icon: '🔧'},
  {id: '2', name: 'Engine', icon: '⚙️'},
  {id: '3', name: 'Brake System', icon: '🛞'},
  {id: '4', name: 'Denting/Painting', icon: '🎨'},
  {id: '5', name: 'AC', icon: '❄️'},
  {id: '6', name: 'Battery', icon: '🔋'},
  {id: '7', name: 'Tyre', icon: '⭕'},
  {id: '8', name: 'Clutch System', icon: '⚡'},
  {id: '9', name: 'Electrical', icon: '💡'},
  {id: '10', name: 'Suspension', icon: '🔩'},
];

export default function NewJobCardOverlay({
  isOpen,
  onClose,
  onAddJob,
  vehicleId,
}: NewJobCardOverlayProps) {
  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [remark, setRemark] = useState('');

  // Staff state
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Media state
  const [vehicleImages, setVehicleImages] = useState<{uri: string; name: string; type: string}[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioPath, setRecordedAudioPath] = useState<string | null>(null);
  const audioRecorderPlayer = useRef(AudioRecorderPlayer);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Success animation
  const successFade = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  // API state
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const isValid = selectedCategory !== '' && remark.trim() !== '';

  // Fetch staff on open
  useEffect(() => {
    if (!isOpen) return;
    setLoadingStaff(true);
    getStaff()
      .then(result => {
        if (result.success && result.data) {
          setStaffMembers(
            result.data.staff.map((s: WorkshopStaffResponse) => ({
              id: String(s.id),
              name: s.name,
            })),
          );
        }
      })
      .finally(() => setLoadingStaff(false));
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategory('');
      setShowCategoryPicker(false);
      setSelectedStaff('');
      setSelectedStaffName('');
      setShowStaffPicker(false);
      setRemark('');
      setStaffMembers([]);
      setVehicleImages([]);
      setIsRecording(false);
      setRecordedAudioPath(null);
      audioRecorderPlayer.current.stopRecorder().catch(() => {});
      setIsLoading(false);
      setApiError(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Recording pulse animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {toValue: 0.2, duration: 500, useNativeDriver: true}),
          Animated.timing(pulseAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Success animation
  useEffect(() => {
    if (showSuccess) {
      successFade.setValue(0);
      checkScale.setValue(0);
      textFade.setValue(0);
      Animated.parallel([
        Animated.timing(successFade, {
          toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(100),
          Animated.spring(checkScale, {toValue: 1, friction: 4, tension: 40, useNativeDriver: true}),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(textFade, {
            toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [showSuccess]);

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => onClose(), 1500);
      return () => clearTimeout(t);
    }
  }, [showSuccess, onClose]);

  const handlePickImage = () => {
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.8, selectionLimit: MAX_IMAGES - vehicleImages.length},
      response => {
        if (!response.didCancel && !response.errorCode && response.assets?.length) {
          const newImages = response.assets
            .filter(a => a.uri)
            .map(a => ({
              uri: a.uri!,
              name: a.fileName || `photo_${Date.now()}.jpg`,
              type: a.type || 'image/jpeg',
            }));
          setVehicleImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
        }
      },
    );
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

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setApiError(null);

    try {
      const jobData: CreateJobCardData = {
        vehicleId,
        jobCategory: selectedCategory,
        assignedStaffId: selectedStaff ? parseInt(selectedStaff, 10) : undefined,
        remark,
        priority: 'Normal',
      };

      const audioFile = recordedAudioPath
        ? {uri: recordedAudioPath, name: `job_audio_${Date.now()}.mp4`, type: 'audio/mp4'}
        : undefined;

      const result =
        audioFile || vehicleImages.length > 0
          ? await createJobCardWithMedia(
              jobData,
              audioFile,
              vehicleImages.length > 0 ? vehicleImages : undefined,
            )
          : await createJobCard(jobData);

      if (!result.success) {
        setApiError(result.error || 'Failed to create job card');
        return;
      }

      onAddJob?.(jobData);
      setShowSuccess(true);
    } catch {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.title}>New Job Card</Text>
          </View>

          {/* Job Category Dropdown */}
          <View style={styles.fieldWrap}>
            {selectedCategory !== '' && <Text style={styles.floatLabel}>Job Category</Text>}
            <TouchableOpacity
              style={[styles.dropdown, (showCategoryPicker || selectedCategory !== '') && styles.dropdownActive]}
              onPress={() => {
                setShowCategoryPicker(v => !v);
                setShowStaffPicker(false);
              }}
              activeOpacity={0.8}>
              <Text style={[styles.dropdownText, !selectedCategory && styles.dropdownPlaceholder]}>
                {selectedCategory || 'Job Category'}
              </Text>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M6 9L12 15L18 9"
                  stroke="#e5383b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.pickerCard}>
                <View style={styles.categoryGrid}>
                  {jobCategories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryBtn,
                        selectedCategory === cat.name && styles.categoryBtnActive,
                      ]}
                      onPress={() => {
                        setSelectedCategory(cat.name);
                        setShowCategoryPicker(false);
                      }}
                      activeOpacity={0.8}>
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategory === cat.name && styles.categoryTextActive,
                        ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Assign Staff Dropdown */}
          <View style={styles.fieldWrap}>
            {selectedStaffName !== '' && <Text style={styles.floatLabel}>Assign Staff</Text>}
            <TouchableOpacity
              style={[
                styles.dropdown,
                (showStaffPicker || selectedStaffName !== '') && styles.dropdownActive,
              ]}
              onPress={() => {
                setShowStaffPicker(v => !v);
                setShowCategoryPicker(false);
              }}
              activeOpacity={0.8}>
              <Text style={[styles.dropdownText, !selectedStaffName && styles.dropdownPlaceholder]}>
                {selectedStaffName || 'Assign Staff'}
              </Text>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M6 9L12 15L18 9"
                  stroke="#e5383b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {showStaffPicker && (
              <View style={styles.pickerList}>
                {loadingStaff ? (
                  <ActivityIndicator color="#e5383b" style={styles.staffLoader} />
                ) : staffMembers.length === 0 ? (
                  <Text style={styles.emptyText}>No staff available</Text>
                ) : (
                  staffMembers.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.staffItem, selectedStaff === s.id && styles.staffItemActive]}
                      onPress={() => {
                        setSelectedStaff(s.id);
                        setSelectedStaffName(s.name);
                        setShowStaffPicker(false);
                      }}
                      activeOpacity={0.8}>
                      <Text style={styles.staffItemText}>{s.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Remark + Record button */}
          <View style={styles.fieldWrap}>
            {(remark !== '' || recordedAudioPath !== null) && (
              <Text style={styles.floatLabel}>Remark</Text>
            )}
            {!isRecording && (
              <View style={styles.remarkRow}>
                <TextInput
                  value={remark}
                  onChangeText={setRemark}
                  placeholder="Remark"
                  placeholderTextColor="#828282"
                  style={[
                    styles.dropdown,
                    styles.remarkInput,
                    remark !== '' && styles.dropdownActive,
                  ]}
                />
                <TouchableOpacity
                  onPress={handleRecord}
                  style={styles.recordBtn}
                  activeOpacity={0.8}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12 19V23"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.recordBtnText}>Record</Text>
                </TouchableOpacity>
              </View>
            )}

            {isRecording && (
              <View style={styles.recordingRow}>
                <Animated.View style={[styles.recordingDot, {opacity: pulseAnim}]} />
                <Text style={styles.recordingText}>Recording...</Text>
                <TouchableOpacity onPress={handleRecord} style={styles.stopBtn} activeOpacity={0.8}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Rect x="6" y="6" width="12" height="12" rx="2" fill="white" />
                  </Svg>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Media Grid */}
          {(recordedAudioPath !== null || vehicleImages.length > 0 || vehicleImages.length < MAX_IMAGES) && (
            <View style={styles.mediaGrid}>
              {/* Audio card */}
              {recordedAudioPath !== null && !isRecording && (
                <View style={styles.mediaCard}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z"
                      stroke="#e5383b"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10"
                      stroke="#e5383b"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.audioCardText}>Audio</Text>
                  <TouchableOpacity
                    onPress={() => setRecordedAudioPath(null)}
                    style={styles.mediaDeleteBtn}
                    activeOpacity={0.8}>
                    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              )}

              {/* Image cards */}
              {vehicleImages.map((img, idx) => (
                <View key={idx} style={styles.mediaCard}>
                  <Image source={{uri: img.uri}} style={styles.mediaImage} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setVehicleImages(prev => prev.filter((_, i) => i !== idx))}
                    style={styles.mediaDeleteBtn}
                    activeOpacity={0.8}>
                    <Svg width={10} height={12} viewBox="0 0 12 14" fill="none">
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

              {/* Add button */}
              {vehicleImages.length < MAX_IMAGES && (
                <TouchableOpacity
                  style={styles.mediaAddBtn}
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
                  <Text style={styles.mediaAddCount}>
                    {vehicleImages.length}/{MAX_IMAGES}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Error */}
          {apiError && <Text style={styles.errorText}>{apiError}</Text>}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            style={[styles.submitBtn, (!isValid || isLoading) && styles.disabledBtn]}
            activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>ADD JOB</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Success overlay — sibling of sheet */}
      {showSuccess && (
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
            JOB CARD ADDED
          </Animated.Text>
        </Animated.View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12,
    maxHeight: '92%',
  },
  handle: {
    width: 172, height: 4, backgroundColor: '#d9d9d9',
    borderRadius: 23, alignSelf: 'center', marginBottom: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 16, marginBottom: 8,
  },
  backBtn: {padding: 4},
  title: {fontSize: 24, fontWeight: '600', color: '#000'},
  fieldWrap: {position: 'relative', marginBottom: 16},
  floatLabel: {
    position: 'absolute', top: -8, left: 12,
    backgroundColor: '#fff', paddingHorizontal: 4,
    fontSize: 11, color: '#828282', zIndex: 10,
  },
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#d3d3d3', borderRadius: 8,
  },
  dropdownActive: {borderColor: '#e5383b'},
  dropdownText: {fontSize: 15, color: '#000'},
  dropdownPlaceholder: {color: '#828282'},
  pickerCard: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e0e0e0',
    borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  categoryBtn: {
    width: '30%', flexGrow: 1,
    alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0',
  },
  categoryBtnActive: {borderColor: '#e5383b', backgroundColor: '#fff5f5'},
  categoryIcon: {fontSize: 24},
  categoryText: {fontSize: 11, color: '#000', textAlign: 'center'},
  categoryTextActive: {color: '#e5383b', fontWeight: '600'},
  pickerList: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  staffLoader: {padding: 12},
  emptyText: {padding: 16, fontSize: 14, color: '#828282', textAlign: 'center'},
  staffItem: {paddingHorizontal: 16, paddingVertical: 12},
  staffItemActive: {backgroundColor: '#fff5f5'},
  staffItemText: {fontSize: 15, color: '#000'},
  remarkRow: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  remarkInput: {flex: 1, justifyContent: 'center'},
  recordBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#e5383b', borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 14,
  },
  recordBtnText: {color: '#fff', fontSize: 14, fontWeight: '500'},
  recordingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#e5383b',
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff5f5',
  },
  recordingDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#e5383b',
  },
  recordingText: {flex: 1, fontSize: 15, color: '#e5383b', fontWeight: '500'},
  stopBtn: {
    width: 40, height: 32,
    backgroundColor: '#e5383b', borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  mediaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16,
  },
  mediaCard: {
    width: 80, height: 80,
    borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e5383b',
    backgroundColor: '#fff5f5',
    alignItems: 'center', justifyContent: 'center',
  },
  mediaImage: {width: 80, height: 80},
  audioCardText: {fontSize: 10, color: '#e5383b', fontWeight: '500', marginTop: 4},
  mediaDeleteBtn: {
    position: 'absolute', bottom: 4, right: 4,
    width: 22, height: 22,
    backgroundColor: '#e5383b', borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  mediaAddBtn: {
    width: 80, height: 80,
    borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    alignItems: 'center', justifyContent: 'center',
  },
  mediaAddCount: {fontSize: 10, color: '#828282', marginTop: 2},
  errorText: {
    fontSize: 13, color: '#e5383b', marginBottom: 12, textAlign: 'center',
  },
  submitBtn: {
    height: 56, borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8, marginBottom: 8,
  },
  disabledBtn: {backgroundColor: '#d3d3d3'},
  submitText: {color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 1},
  successOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SCREEN_H * 0.9,
    backgroundColor: '#e5383b',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
  successCheck: {
    width: 61, height: 61,
    backgroundColor: '#fff', borderRadius: 30.5,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  successText: {
    color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1,
  },
});
