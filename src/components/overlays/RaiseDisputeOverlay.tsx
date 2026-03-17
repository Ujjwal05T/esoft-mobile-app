import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Image,
  Platform,
  PermissionsAndroid,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import {launchImageLibrary} from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const SCREEN_H = Dimensions.get('screen').height;

// Types
interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  specs: string;
  plateNumber: string;
}

interface Part {
  id: string;
  name: string;
}

interface Reason {
  id: string;
  name: string;
}

interface OrderWithParts {
  id: string;
  orderId: string;
  date: string;
  parts: Part[];
}

export interface DisputeFormData {
  orderId: string;
  partId: string;
  partName: string;
  reason: string;
  remark: string;
  audioPath?: string;
  images: {uri: string; name: string}[];
}

interface RaiseDisputeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: DisputeFormData) => void;
  vehicleInfo?: VehicleInfo;
  orders?: OrderWithParts[];
  reasons?: Reason[];
  buttonText?: 'CONFIRM' | 'SEND REQUEST';
  initialOrderId?: string;      // pre-fill order (matches OrderWithParts.id)
  initialOrderDisplay?: string; // text shown in the order input field
  initialPartId?: string;
  initialPartName?: string;
  initialReason?: string;
  initialRemark?: string;
}

// Icons
const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownIcon = ({rotated}: {rotated: boolean}) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d={rotated ? 'M17 14L12 9L7 14' : 'M7 10L12 15L17 10'}
      stroke="#e5383b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MicIcon = () => (
  <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
    <Path
      d="M8 12C9.66 12 11 10.66 11 9V3C11 1.34 9.66 0 8 0C6.34 0 5 1.34 5 3V9C5 10.66 6.34 12 8 12ZM14 9C14 12.53 10.96 15.36 7.5 15.93V18H10V20H6V18H8.5V15.93C5.04 15.36 2 12.53 2 9H0C0 13.08 3.05 16.44 7 16.93V18H9V16.93C12.95 16.44 16 13.08 16 9H14Z"
      fill="white"
    />
  </Svg>
);

const StopIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Rect x="5" y="5" width="10" height="10" rx="2" fill="white" />
  </Svg>
);

const TrashIcon = ({color = '#e5383b'}: {color?: string}) => (
  <Svg width={16} height={18} viewBox="0 0 18 20" fill="none">
    <Path
      d="M1 5H17M7 9V15M11 9V15M2 5L3 17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H13C13.5304 19 14.0391 18.7893 14.4142 18.4142C14.7893 18.0391 15 17.5304 15 17L16 5M6 5V2C6 1.73478 6.10536 1.48043 6.29289 1.29289C6.48043 1.10536 6.73478 1 7 1H11C11.2652 1 11.5196 1.10536 11.7071 1.29289C11.8946 1.48043 12 1.73478 12 2V5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path
      d="M16 6V26M6 16H26"
      stroke="#e5383b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const defaultReasons: Reason[] = [
  {id: '1', name: 'Wrong Part Delivered'},
  {id: '2', name: 'Damaged Part'},
];

export default function RaiseDisputeOverlay({
  isOpen,
  onClose,
  onConfirm,
  vehicleInfo,
  orders = [],
  reasons = defaultReasons,
  buttonText = 'CONFIRM',
  initialOrderId,
  initialOrderDisplay,
  initialPartId,
  initialPartName,
  initialReason,
  initialRemark,
}: RaiseDisputeOverlayProps) {
  // Form state
  const [orderId, setOrderId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [remark, setRemark] = useState('');

  // Get selected order and its parts
  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const availableParts = selectedOrder?.parts || [];

  // Filter order suggestions based on input
  const filteredSuggestions = orders.filter(order =>
    order.orderId.toLowerCase().includes(orderId.toLowerCase())
  );

  // Dropdown state
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  // Validation
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioPath, setRecordedAudioPath] = useState<string | null>(null);
  const audioRecorderPlayer = useRef(AudioRecorderPlayer);

  // Image state — 3 fixed slots
  const [images, setImages] = useState<({uri: string; name: string} | null)[]>([
    null,
    null,
    null,
  ]);

  // Success animation
  const [showSuccess, setShowSuccess] = useState(false);
  const successFade = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showSuccess) {
      Animated.sequence([
        Animated.timing(successFade, {toValue: 1, duration: 300, useNativeDriver: true}),
        Animated.spring(checkScale, {toValue: 1, friction: 5, useNativeDriver: true}),
        Animated.timing(textFade, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]).start();
      const t = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  // Seed / reset form when overlay opens or closes
  useEffect(() => {
    if (isOpen) {
      if (initialOrderId) {
        setSelectedOrderId(initialOrderId);
        setOrderId(initialOrderDisplay ?? initialOrderId);
      }
      if (initialPartId) setSelectedPartId(initialPartId);
      if (initialPartName) setSelectedPart(initialPartName);
      if (initialReason) setSelectedReason(initialReason);
      if (initialRemark) setRemark(initialRemark);
    } else {
      setOrderId('');
      setSelectedOrderId('');
      setSelectedPartId('');
      setSelectedPart('');
      setSelectedReason('');
      setRemark('');
      setShowOrderDropdown(false);
      setShowPartDropdown(false);
      setShowReasonDropdown(false);
      setHasAttemptedSubmit(false);
      setIsRecording(false);
      setRecordedAudioPath(null);
      setImages([null, null, null]);
      setShowSuccess(false);
      successFade.setValue(0);
      checkScale.setValue(0);
      textFade.setValue(0);
    }
  }, [isOpen]);

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

  const handlePickImage = (index: number) => {
    launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1}, response => {
      if (!response.didCancel && !response.errorCode && response.assets?.length) {
        const asset = response.assets[0];
        if (asset.uri) {
          setImages(prev => {
            const updated = [...prev];
            updated[index] = {
              uri: asset.uri!,
              name: asset.fileName || `dispute_photo_${Date.now()}.jpg`,
            };
            return updated;
          });
        }
      }
    });
  };

  const handleDeleteImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  const handleConfirm = () => {
    setHasAttemptedSubmit(true);
    if (!orderId.trim() || !selectedPart || !selectedReason || !remark.trim()) return;

    // Call parent callback with form data
    onConfirm({
      orderId,
      partId: selectedPartId,
      partName: selectedPart,
      reason: selectedReason,
      remark,
      audioPath: recordedAudioPath || undefined,
      images: images.filter(
        (img): img is {uri: string; name: string} => img !== null
      ),
    });

    setShowSuccess(true);
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        {/* Drag Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={{padding: 4}}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Raise Dispute</Text>
        </View>

        {/* Vehicle Info */}
        {vehicleInfo && (
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleLeft}>
              <Text style={styles.vehicleName}>
                {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
              </Text>
              <Text style={styles.vehicleSpecs}>{vehicleInfo.specs}</Text>
            </View>
            <View style={styles.plateBox}>
              <Text style={styles.plateText}>{vehicleInfo.plateNumber}</Text>
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            {/* Order ID with Autocomplete */}
            <View style={styles.fieldWrapper}>
              <View
                style={[
                  styles.inputField,
                  !!orderId && {borderColor: '#e5383b'},
                  hasAttemptedSubmit && !orderId.trim() && styles.inputError,
                  {marginTop:10}
                ]}>
                {!!orderId && <Text style={styles.floatLabel}>Order ID</Text>}
                <TextInput
                  value={orderId}
                  onChangeText={(text) => {
                    setOrderId(text);
                    setShowOrderDropdown(text.length > 0);
                  }}
                  onFocus={() => orderId.length > 0 && setShowOrderDropdown(true)}
                  placeholder="Order ID"
                  placeholderTextColor="#828282"
                  style={styles.inputText}
                />
              </View>
              {showOrderDropdown && filteredSuggestions.length > 0 && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {filteredSuggestions.map(order => (
                      <TouchableOpacity
                        key={order.id}
                        onPress={() => {
                          setOrderId(order.orderId);
                          setSelectedOrderId(order.id);
                          setShowOrderDropdown(false);
                          setSelectedPart('');
                          setSelectedPartId('');
                        }}
                        style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>
                          {order.orderId} -{' '}
                          {new Date(order.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {hasAttemptedSubmit && !orderId.trim() && (
                <Text style={styles.errorMsg}>Please enter order ID</Text>
              )}
            </View>

            {/* Select Part */}
            <View style={styles.fieldWrapper}>
              <TouchableOpacity
                onPress={() => {
                  setShowPartDropdown(v => !v);
                  setShowOrderDropdown(false);
                  setShowReasonDropdown(false);
                }}
                style={[
                  styles.dropdownBtn,
                  !!selectedPart && {borderColor: '#e5383b'},
                  hasAttemptedSubmit && !selectedPart && styles.inputError,
                ]}>
                {!!selectedPart && <Text style={styles.floatLabel}>Part Name</Text>}
                <Text
                  style={[styles.dropdownText, !selectedPart && styles.placeholderText]}>
                  {selectedPart || 'Select Part'}
                </Text>
                <ChevronDownIcon rotated={showPartDropdown} />
              </TouchableOpacity>
              {showPartDropdown && availableParts.length > 0 && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {availableParts.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => {
                          setSelectedPartId(p.id);
                          setSelectedPart(p.name);
                          setShowPartDropdown(false);
                        }}
                        style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {showPartDropdown && !selectedOrderId && (
                <View style={styles.dropdownList}>
                  <View style={styles.dropdownItem}>
                    <Text style={[styles.dropdownItemText, {color: '#828282'}]}>
                      Please select an order first
                    </Text>
                  </View>
                </View>
              )}
              {showPartDropdown && selectedOrderId && availableParts.length === 0 && (
                <View style={styles.dropdownList}>
                  <View style={styles.dropdownItem}>
                    <Text style={[styles.dropdownItemText, {color: '#828282'}]}>
                      No parts available for this order
                    </Text>
                  </View>
                </View>
              )}
              {hasAttemptedSubmit && !selectedPart && (
                <Text style={styles.errorMsg}>Please select a part</Text>
              )}
            </View>

            {/* Select Reason */}
            <View style={styles.fieldWrapper}>
              <TouchableOpacity
                onPress={() => {
                  setShowReasonDropdown(v => !v);
                  setShowOrderDropdown(false);
                  setShowPartDropdown(false);
                }}
                style={[
                  styles.dropdownBtn,
                  !!selectedReason && {borderColor: '#e5383b'},
                  hasAttemptedSubmit && !selectedReason && styles.inputError,
                ]}>
                {!!selectedReason && <Text style={styles.floatLabel}>Reason</Text>}
                <Text
                  style={[styles.dropdownText, !selectedReason && styles.placeholderText]}>
                  {selectedReason || 'Select Reason'}
                </Text>
                <ChevronDownIcon rotated={showReasonDropdown} />
              </TouchableOpacity>
              {showReasonDropdown && reasons.length > 0 && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {reasons.map(r => (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => {
                          setSelectedReason(r.name);
                          setShowReasonDropdown(false);
                        }}
                        style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>{r.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {hasAttemptedSubmit && !selectedReason && (
                <Text style={styles.errorMsg}>Please select a reason</Text>
              )}
            </View>

            {/* Remark */}
            <View style={styles.fieldWrapper}>
              <View
                style={[
                  styles.remarkField,
                  !!remark && {borderColor: '#e5383b'},
                  hasAttemptedSubmit && !remark.trim() && styles.inputError,
                ]}>
                {!!remark && <Text style={styles.floatLabel}>Remark</Text>}
                <TextInput
                  value={remark}
                  onChangeText={setRemark}
                  placeholder="Remark"
                  placeholderTextColor="#828282"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={styles.inputText}
                />
              </View>
              {hasAttemptedSubmit && !remark.trim() && (
                <Text style={styles.errorMsg}>Please add a remark</Text>
              )}
            </View>

            {/* Audio Recording */}
            <TouchableOpacity
              onPress={handleRecord}
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
              activeOpacity={0.85}>
              {isRecording ? <StopIcon /> : <MicIcon />}
              <Text style={styles.recordBtnText}>
                {isRecording
                  ? 'Stop Recording...'
                  : recordedAudioPath
                  ? 'Re-record Audio'
                  : 'Press To Record Audio'}
              </Text>
            </TouchableOpacity>

            {/* Audio recorded chip */}
            {recordedAudioPath && !isRecording && (
              <View style={styles.audioChip}>
                <Svg width={14} height={14} viewBox="0 0 16 20" fill="none">
                  <Path
                    d="M8 12C9.66 12 11 10.66 11 9V3C11 1.34 9.66 0 8 0C6.34 0 5 1.34 5 3V9C5 10.66 6.34 12 8 12ZM14 9C14 12.53 10.96 15.36 7.5 15.93V18H10V20H6V18H8.5V15.93C5.04 15.36 2 12.53 2 9H0C0 13.08 3.05 16.44 7 16.93V18H9V16.93C12.95 16.44 16 13.08 16 9H14Z"
                    fill="#16a34a"
                  />
                </Svg>
                <Text style={styles.audioChipText}>Audio recorded</Text>
                <TouchableOpacity
                  onPress={() => setRecordedAudioPath(null)}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={styles.audioChipRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Image Upload — 3 slots */}
            <View style={styles.imageRow}>
              {[0, 1, 2].map(index => (
                <View key={index} style={styles.imageSlotWrapper}>
                  <TouchableOpacity
                    onPress={() => !images[index] && handlePickImage(index)}
                    style={[
                      styles.imageSlot,
                      !!images[index] && styles.imageSlotFilled,
                    ]}>
                    {images[index] ? (
                      <Image
                        source={{uri: images[index]!.uri}}
                        style={styles.imagePreview}
                      />
                    ) : (
                      <PlusIcon />
                    )}
                  </TouchableOpacity>
                  {images[index] && (
                    <TouchableOpacity
                      onPress={() => handleDeleteImage(index)}
                      style={styles.imageDeleteBtn}>
                      <TrashIcon color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Confirm Button */}
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>{buttonText}</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>

        {/* Success Overlay */}
        {showSuccess && (
          <Animated.View style={[styles.successOverlay, {opacity: successFade}]}>
            <Animated.View
              style={[
                styles.successCheck,
                {transform: [{scale: checkScale}], opacity: checkScale},
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
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#dadada',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {fontSize: 22, fontWeight: '700', color: '#000'},
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  vehicleLeft: {flex: 1},
  vehicleName: {fontSize: 18, fontWeight: '600', color: '#e5383b'},
  vehicleSpecs: {fontSize: 12, color: '#828282', marginTop: 2},
  plateBox: {
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
  },
  plateText: {fontSize: 12, fontWeight: '600', color: '#e5383b'},
  form: {gap: 16, paddingHorizontal: 20, paddingBottom: 32},
  fieldWrapper: {gap: 4},
  inputField: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  remarkField: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    minHeight: 80,
  },
  inputError: {borderColor: '#e5383b', backgroundColor: '#ffe0e0'},
  floatLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    fontSize: 11,
    color: '#828282',
    zIndex: 1,
  },
  inputText: {fontSize: 15, color: '#000', padding: 0},
  placeholderText: {color: '#828282'},
  errorMsg: {fontSize: 12, color: '#e5383b'},
  dropdownBtn: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  dropdownText: {fontSize: 15, color: '#000', flex: 1},
  dropdownList: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {fontSize: 14, color: '#e5383b'},
  recordBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordBtnActive: {opacity: 0.85},
  recordBtnText: {color: '#fff', fontSize: 14, fontWeight: '500'},
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
  },
  audioChipText: {fontSize: 12, color: '#16a34a', fontWeight: '500'},
  audioChipRemove: {fontSize: 12, color: '#16a34a', fontWeight: '700'},
  imageRow: {flexDirection: 'row', gap: 12, justifyContent: 'center'},
  imageSlotWrapper: {position: 'relative'},
  imageSlot: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d3d3d3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  imageSlotFilled: {borderColor: 'transparent'},
  imagePreview: {width: 100, height: 100, borderRadius: 8},
  imageDeleteBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 1},
  // Success overlay
  successOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.9,
    backgroundColor: '#e5383b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  successCheck: {
    width: 61,
    height: 61,
    borderRadius: 31,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successText: {color: '#fff', fontSize: 20, fontWeight: '500', letterSpacing: 1},
});
