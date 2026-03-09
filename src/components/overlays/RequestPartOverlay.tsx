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
  Dimensions,
  Animated,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Svg, {Path, Rect, Circle} from 'react-native-svg';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {launchImageLibrary} from 'react-native-image-picker';
import AppAlert, {AlertState} from './AppAlert';

const SCREEN_H = Dimensions.get('window').height;

const brandOptions = [
  {id: '1', name: 'OEM - Original Brands'},
  {id: '2', name: 'After Market'},
];

const generateId = () =>
  `part-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

interface PartItem {
  id: string;
  partName: string;
  preferredBrand: string;
  quantity: string;
  remark: string;
  isExpanded: boolean;
  hasAttemptedSubmit: boolean;
  audioPath: string | null;
  audioDuration: number;
  images: ({uri: string; name: string} | null)[];
  isBrandDropdownOpen: boolean;
}

const createEmptyPart = (): PartItem => ({
  id: generateId(),
  partName: '',
  preferredBrand: '',
  quantity: '',
  remark: '',
  isExpanded: true,
  hasAttemptedSubmit: false,
  audioPath: null,
  audioDuration: 0,
  images: [null, null, null],
  isBrandDropdownOpen: false,
});

interface RequestPartOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (parts: PartItem[]) => void;
}

/* ── Icons ─────────────────────────────────────────────────────────── */

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

const ChevronIcon = ({
  color = '#e5383b',
  rotated = false,
}: {
  color?: string;
  rotated?: boolean;
}) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    style={rotated ? {transform: [{rotate: '180deg'}]} : undefined}>
    <Path
      d="M7 10L12 15L17 10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = () => (
  <Svg width={18} height={20} viewBox="0 0 18 20" fill="none">
    <Path
      d="M1 5H17M7 9V15M11 9V15M2 5L3 17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H13C13.5304 19 14.0391 18.7893 14.4142 18.4142C14.7893 18.0391 15 17.5304 15 17L16 5M6 5V2C6 1.73478 6.10536 1.48043 6.29289 1.29289C6.48043 1.10536 6.73478 1 7 1H11C11.2652 1 11.5196 1.10536 11.7071 1.29289C11.8946 1.48043 12 1.73478 12 2V5"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MicIcon = () => (
  <Svg width={14} height={18} viewBox="0 0 16 20" fill="none">
    <Path
      d="M8 12C9.66 12 11 10.66 11 9V3C11 1.34 9.66 0 8 0C6.34 0 5 1.34 5 3V9C5 10.66 6.34 12 8 12ZM14 9C14 12.53 10.96 15.36 7.5 15.93V18H10V20H6V18H8.5V15.93C5.04 15.36 2 12.53 2 9H0C0 13.08 3.05 16.44 7 16.93V18H9V16.93C12.95 16.44 16 13.08 16 9H14Z"
      fill="white"
    />
  </Svg>
);

const StopIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="6" width="12" height="12" rx="2" fill="white" />
  </Svg>
);

const PlayIcon = () => (
  <Svg width={12} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M8 5V19L19 12L8 5Z" fill="white" />
  </Svg>
);

const PauseIcon = () => (
  <Svg width={12} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="5" width="4" height="14" rx="1" fill="white" />
    <Rect x="14" y="5" width="4" height="14" rx="1" fill="white" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 32 32" fill="none">
    <Path
      d="M16 6V26M6 16H26"
      stroke="#e5383b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DiagonalArrowIcon = () => (
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
);

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/* ── Component ─────────────────────────────────────────────────────── */

export default function RequestPartOverlay({
  isOpen,
  onClose,
  onSubmit,
}: RequestPartOverlayProps) {
  /* AppAlert */
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  /* View */
  const [currentView, setCurrentView] = useState<'search' | 'form'>('search');
  const [partNumber, setPartNumber] = useState('');

  /* Parts */
  const [parts, setParts] = useState<PartItem[]>([createEmptyPart()]);

  /* Audio (shared) */
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPartId, setRecordingPartId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const audioRecorderPlayerRef = useRef<typeof AudioRecorderPlayer | null>(null);
  if (!audioRecorderPlayerRef.current) {
    audioRecorderPlayerRef.current = AudioRecorderPlayer;
  }
  const audioRecorderPlayer = audioRecorderPlayerRef.current;
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeRef = useRef(0);
  const recordingPartIdRef = useRef<string | null>(null);

  /* Playback */
  const [playingPartId, setPlayingPartId] = useState<string | null>(null);

  /* Success */
  const [showSuccess, setShowSuccess] = useState(false);
  const successFade = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setCurrentView('search');
      setPartNumber('');
      setParts([createEmptyPart()]);
      setIsRecording(false);
      setRecordingPartId(null);
      recordingPartIdRef.current = null;
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setPlayingPartId(null);
      setShowSuccess(false);
      successFade.setValue(0);
      checkScale.setValue(0);
      textFade.setValue(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* Success animation */
  useEffect(() => {
    if (showSuccess) {
      Animated.sequence([
        Animated.timing(successFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(textFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      const t = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccess]);

  /* Part helpers */
  const updatePart = (id: string, updates: Partial<PartItem>) =>
    setParts(prev => prev.map(p => (p.id === id ? {...p, ...updates} : p)));

  const toggleExpand = (id: string) =>
    setParts(prev =>
      prev.map(p => (p.id === id ? {...p, isExpanded: !p.isExpanded} : p)),
    );

  const deletePart = (id: string) =>
    setParts(prev => prev.filter(p => p.id !== id));

  const addAnotherPart = () =>
    setParts(prev => [
      ...prev.map(p => ({...p, isExpanded: false})),
      createEmptyPart(),
    ]);

  /* Audio recording */
  const startRecording = async (partId: string) => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Audio Recording Permission',
            message: 'This app needs access to your microphone to record audio.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setAppAlert({type: 'warning', title: 'Permission Denied', message: 'Audio recording permission is required.'});
          return;
        }
      }
      await audioRecorderPlayer?.startRecorder();
      recordingTimeRef.current = 0;
      recordingPartIdRef.current = partId;
      setIsRecording(true);
      setRecordingPartId(partId);
      setRecordingTime(0);
      recordingTimer.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (e) {
      console.error('startRecorder error', e);
      setAppAlert({type: 'error', message: 'Could not start recording. Please check permissions.'});
    }
  };

  const stopRecording = async () => {
    try {
      const path = await audioRecorderPlayer?.stopRecorder();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      const partId = recordingPartIdRef.current;
      const duration = recordingTimeRef.current;
      if (partId) {
        updatePart(partId, {audioPath: path, audioDuration: duration});
      }
      setIsRecording(false);
      setRecordingPartId(null);
      recordingPartIdRef.current = null;
    } catch (e) {
      console.error('stopRecorder error', e);
    }
  };

  /* Playback */
  const togglePlayback = async (partId: string, path: string) => {
    try {
      if (playingPartId === partId) {
        await audioRecorderPlayer?.stopPlayer();
        setPlayingPartId(null);
      } else {
        if (playingPartId) await audioRecorderPlayer?.stopPlayer();
        await audioRecorderPlayer?.startPlayer(path);
        setPlayingPartId(partId);
        audioRecorderPlayer?.addPlayBackListener(e => {
          if (e.currentPosition >= e.duration) {
            setPlayingPartId(null);
          }
        });
      }
    } catch (e) {
      console.error('playback error', e);
    }
  };

  /* Images */
  const pickImage = (partId: string) => {
    launchImageLibrary({mediaType: 'photo', quality: 0.8}, res => {
      if (!res.didCancel && !res.errorCode && res.assets?.[0]) {
        const a = res.assets[0];
        setParts(prev => {
          const part = prev.find(p => p.id === partId);
          if (!part) return prev;
          const firstEmpty = part.images.findIndex(img => !img);
          if (firstEmpty === -1) return prev;
          const newImages = [...part.images] as PartItem['images'];
          newImages[firstEmpty] = {
            uri: a.uri!,
            name: a.fileName || `photo_${Date.now()}.jpg`,
          };
          return prev.map(p =>
            p.id === partId ? {...p, images: newImages} : p,
          );
        });
      }
    });
  };

  const deleteImage = (partId: string, idx: number) => {
    setParts(prev =>
      prev.map(p => {
        if (p.id !== partId) return p;
        const newImages = [...p.images] as PartItem['images'];
        newImages[idx] = null;
        return {...p, images: newImages};
      }),
    );
  };

  /* Validation + submit */
  const handleSendRequest = () => {
    let valid = true;

    setParts(prev =>
      prev.map(p => {
        const hasErr =
          !p.partName.trim() ||
          !p.preferredBrand ||
          !p.quantity.trim() ||
          (!p.remark.trim() && !p.audioPath);
        if (hasErr) valid = false;
        return {
          ...p,
          hasAttemptedSubmit: true,
          isExpanded: hasErr ? true : p.isExpanded,
        };
      }),
    );
    if (valid) {
      onSubmit?.(parts);
      setShowSuccess(true);
    }
  };

  /* Render one accordion part */
  const renderPart = (part: PartItem, index: number) => {
    const isThisRecording = isRecording && recordingPartId === part.id;
    const isThisPlaying = playingPartId === part.id;
    const imageCount = part.images.filter(Boolean).length;
    const title = part.partName.trim() || `Part Request ${index + 1}`;

    return (
      <View key={part.id} style={styles.accordionWrap}>
        {/* Header */}
        <TouchableOpacity
          onPress={() => toggleExpand(part.id)}
          style={styles.accordionHeader}
          activeOpacity={0.85}>
          <View style={styles.accordionLeft}>
            <Text style={styles.accordionTitle} numberOfLines={1}>
              {title}
            </Text>
            {!!part.quantity && (
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyBadgeText}>Qty: {part.quantity}</Text>
              </View>
            )}
          </View>
          <View style={styles.accordionRight}>
            {parts.length > 1 && (
              <TouchableOpacity
                onPress={() => deletePart(part.id)}
                style={styles.trashBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <TrashIcon />
              </TouchableOpacity>
            )}
            <ChevronIcon color="white" rotated={part.isExpanded} />
          </View>
        </TouchableOpacity>

        {/* Content */}
        {part.isExpanded && (
          <View style={styles.accordionContent}>
            {/* Part Name */}
            <View style={styles.fieldWrap}>
              <View
                style={[
                  styles.inputBorder,
                  !!part.partName && styles.inputFilled,
                  part.hasAttemptedSubmit &&
                    !part.partName.trim() &&
                    styles.inputError,
                ]}>
                {!!part.partName && (
                  <Text style={styles.floatLabel}>Part Name</Text>
                )}
                <TextInput
                  value={part.partName}
                  onChangeText={v => updatePart(part.id, {partName: v})}
                  placeholder="Part Name"
                  placeholderTextColor="#828282"
                  style={styles.inputText}
                />
              </View>
              {part.hasAttemptedSubmit && !part.partName.trim() && (
                <Text style={styles.errorMsg}>Please add part name</Text>
              )}
            </View>

            {/* Preferred Brand */}
            <View
              style={[
                styles.fieldWrap,
                part.isBrandDropdownOpen && {zIndex: 10}
              ]}>
              <TouchableOpacity
                onPress={() =>
                  updatePart(part.id, {
                    isBrandDropdownOpen: !part.isBrandDropdownOpen,
                  })
                }
                style={[
                  styles.inputBorder,
                  styles.row,
                  !!part.preferredBrand && styles.inputFilled,
                  part.hasAttemptedSubmit &&
                    !part.preferredBrand &&
                    styles.inputError,
                    ,
                ]}>
                {!!part.preferredBrand && (
                  <Text style={styles.floatLabel}>Preferred Brand</Text>
                )}
                <Text
                  style={[
                    styles.inputText,
                    {flex: 1},
                    !part.preferredBrand && {color: '#828282'},
                {padding:9}
                  ]}>
                  {part.preferredBrand || 'Preferred Brand'}
                </Text>
                <ChevronIcon
                  color="#e5383b"
                  rotated={part.isBrandDropdownOpen}
                />
              </TouchableOpacity>
              {part.isBrandDropdownOpen && (
                <View style={styles.dropdownList}>
                  {brandOptions.map(opt => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() =>
                        updatePart(part.id, {
                          preferredBrand: opt.name,
                          isBrandDropdownOpen: false,
                        })
                      }
                      style={styles.dropdownItem}>
                      <Text style={styles.dropdownItemText}>{opt.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {part.hasAttemptedSubmit && !part.preferredBrand && (
                <Text style={styles.errorMsg}>Please select preferred brand</Text>
              )}
            </View>

            {/* Quantity */}
            <View style={styles.fieldWrap}>
              <View
                style={[
                  styles.inputBorder,
                  !!part.quantity && styles.inputFilled,
                  part.hasAttemptedSubmit &&
                    !part.quantity.trim() &&
                    styles.inputError,
                ]}>
                {!!part.quantity && (
                  <Text style={styles.floatLabel}>Quantity</Text>
                )}
                <TextInput
                  value={part.quantity}
                  onChangeText={v => updatePart(part.id, {quantity: v})}
                  placeholder="Quantity"
                  placeholderTextColor="#828282"
                  keyboardType="numeric"
                  style={styles.inputText}
                />
              </View>
              {part.hasAttemptedSubmit && !part.quantity.trim() && (
                <Text style={styles.errorMsg}>Please add quantity</Text>
              )}
            </View>

            {/* Remark + Record */}
            <View style={styles.fieldWrap}>
              {/* No recording, no audio */}
              {!isThisRecording && !part.audioPath && (
                <View
                  style={[
                    styles.inputBorder,
                    styles.row,
                    styles.remarkPad,
                    !!part.remark && styles.inputFilled,
                    part.hasAttemptedSubmit &&
                      !part.remark.trim() &&
                      !part.audioPath &&
                      styles.inputError,
                  ]}>
                  {!!part.remark && (
                    <Text style={styles.floatLabel}>Remark</Text>
                  )}
                  <TextInput
                    value={part.remark}
                    onChangeText={v => updatePart(part.id, {remark: v})}
                    placeholder="Remark"
                    placeholderTextColor="#828282"
                    style={[styles.inputText, {flex: 1}]}
                  />
                  <TouchableOpacity
                    onPress={() => startRecording(part.id)}
                    disabled={isRecording && recordingPartId !== part.id}
                    style={styles.recordBtn}>
                    <MicIcon />
                    <Text style={styles.recordBtnText}>Record</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Recording state */}
              {isThisRecording && (
                <View style={styles.recordingRow}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingLabel}>
                    Recording... {formatTime(recordingTime)}
                  </Text>
                  <TouchableOpacity
                    onPress={stopRecording}
                    style={styles.stopBtn}>
                    <StopIcon />
                  </TouchableOpacity>
                </View>
              )}

              {/* Has audio — remark without record button */}
              {!!part.audioPath && !isThisRecording && (
                <View
                  style={[
                    styles.inputBorder,
                    !!part.remark && styles.inputFilled,
                  ]}>
                  {!!part.remark && (
                    <Text style={styles.floatLabel}>Remark</Text>
                  )}
                  <TextInput
                    value={part.remark}
                    onChangeText={v => updatePart(part.id, {remark: v})}
                    placeholder="Remark"
                    placeholderTextColor="#828282"
                    style={styles.inputText}
                  />
                </View>
              )}

              {part.hasAttemptedSubmit &&
                !part.remark.trim() &&
                !part.audioPath && (
                  <Text style={styles.errorMsg}>Please add remark</Text>
                )}
            </View>

            {/* Media grid */}
            <View style={styles.mediaGrid}>
              {/* Audio card */}
              {!!part.audioPath && (
                <View style={styles.audioCard}>
                  <TouchableOpacity
                    onPress={() => togglePlayback(part.id, part.audioPath!)}
                    style={styles.audioPlayBtn}>
                    {isThisPlaying ? <PauseIcon /> : <PlayIcon />}
                  </TouchableOpacity>
                  <Text style={styles.audioDuration}>
                    {formatTime(part.audioDuration)}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      updatePart(part.id, {audioPath: null, audioDuration: 0})
                    }
                    style={styles.mediaDeleteBtn}>
                    <Text style={styles.mediaDeleteX}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Uploaded images */}
              {part.images.map((img, imgIdx) =>
                img ? (
                  <View key={imgIdx} style={styles.imageCard}>
                    <Image
                      source={{uri: img.uri}}
                      style={styles.imageFull}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => deleteImage(part.id, imgIdx)}
                      style={styles.mediaDeleteBtn}>
                      <Text style={styles.mediaDeleteX}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : null,
              )}

              {/* Add image button */}
              {imageCount < 3 && (
                <TouchableOpacity
                  onPress={() => pickImage(part.id)}
                  style={styles.addImageBtn}>
                  <PlusIcon />
                  <Text style={styles.addImageCount}>{imageCount}/3 img</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

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
        <View style={styles.handle} />

        {currentView === 'search' ? (
          /* ── SEARCH VIEW ── */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.searchPad}>
            <Text style={styles.searchTitle}>
              {'Request by Part\nNumber / Scanning\nPart'}
            </Text>

            {/* Part number input */}
            <View
              style={[
                styles.partNumRow,
                !!partNumber && styles.inputFilled,
              ]}>
              <TextInput
                value={partNumber}
                onChangeText={setPartNumber}
                placeholder="90915-10010"
                placeholderTextColor="#c4c4c4"
                style={[
                  styles.partNumInput,
                  !!partNumber && {color: '#e5383b'},
                ]}
                returnKeyType="done"
                onSubmitEditing={() =>
                  partNumber.trim() && setCurrentView('form')
                }
              />
              <TouchableOpacity
                onPress={() => partNumber.trim() && setCurrentView('form')}
                style={[
                  styles.partNumArrow,
                  !partNumber && {backgroundColor: '#828282'},
                ]}>
                <ArrowRightIcon />
              </TouchableOpacity>
            </View>

            {/* Request Part Manually card */}
            <TouchableOpacity
              onPress={() => setCurrentView('form')}
              style={styles.manualCard}
              activeOpacity={0.85}>
              <View style={styles.manualCardContent}>
                <Text style={styles.manualCardTitle}>
                  {'Request\nPart\nManually'}
                </Text>
                <DiagonalArrowIcon />
              </View>
              <Image
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                source={require('../../assets/images/request-part.png')}
                style={styles.manualCardImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* ── FORM VIEW ── */
          <>
            <View style={styles.formHeader}>
              <TouchableOpacity
                onPress={() => setCurrentView('search')}
                style={styles.backBtn}>
                <BackArrowIcon />
              </TouchableOpacity>
              <Text style={styles.formTitle}>Request Parts</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {parts.length} {parts.length === 1 ? 'Part' : 'Parts'}
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <View style={styles.formPad}>
                {parts.map((p, i) => renderPart(p, i))}

                {/* Add Another Part */}
                <TouchableOpacity
                  onPress={addAnotherPart}
                  style={styles.addAnotherBtn}>
                  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                    <Path
                      d="M10 4V16M4 10H16"
                      stroke="#e5383b"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.addAnotherText}>ADD ANOTHER PART</Text>
                </TouchableOpacity>

                {/* Send Request */}
                <TouchableOpacity
                  onPress={handleSendRequest}
                  style={styles.sendBtn}>
                  <Text style={styles.sendBtnText}>
                    SEND REQUEST ({parts.length}{' '}
                    {parts.length === 1 ? 'PART' : 'PARTS'})
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </>
        )}

        {/* Success Overlay */}
        {showSuccess && (
          <Animated.View
            style={[styles.successOverlay, {opacity: successFade}]}>
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
              REQUEST SENT
            </Animated.Text>
          </Animated.View>
        )}
      </View>
      <AppAlert
        isOpen={!!appAlert}
        type={appAlert?.type ?? 'info'}
        title={appAlert?.title}
        message={appAlert?.message ?? ''}
        onClose={() => {
          const done = appAlert?.onDone;
          setAppAlert(null);
          done?.();
        }}
        onConfirm={appAlert?.onConfirm ? () => {
          const confirm = appAlert.onConfirm!;
          setAppAlert(null);
          confirm();
        } : undefined}
      />
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#dadada',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  /* Search view */
  searchPad: {paddingHorizontal: 17, paddingBottom: 32},
  searchTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#828282',
    fontStyle: 'italic',
    lineHeight: 30,
    marginBottom: 24,
  },
  partNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  partNumInput: {flex: 1, fontSize: 16, fontWeight: '700', color: '#000'},
  partNumArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  manualCard: {
    backgroundColor: '#e5383b',
    borderRadius: 16,
    minHeight: 180,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  manualCardContent: {
    padding: 20,
    flex: 1,
    justifyContent: 'space-between',
    height: 180,
  },
  manualCardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 34,
  },
  manualCardImage: {
    width: 160,
    height: 180,
  },

  /* Form view */
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {padding: 4},
  formTitle: {flex: 1, fontSize: 22, fontWeight: '700', color: '#000'},
  countBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countBadgeText: {fontSize: 14, color: '#828282'},
  formPad: {paddingHorizontal: 20, paddingBottom: 32, gap: 12},

  /* Accordion */
  accordionWrap: {},
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e5383b',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accordionTitle: {fontSize: 15, fontWeight: '500', color: '#fff', flex: 1},
  qtyBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  qtyBadgeText: {fontSize: 12, color: '#fff'},
  accordionRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  trashBtn: {padding: 4},
  accordionContent: {paddingTop: 16, paddingHorizontal: 4, gap: 16},

  /* Fields */
  fieldWrap: {position: 'relative'},
  row: {flexDirection: 'row', alignItems: 'center'},
  inputBorder: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    position: 'relative',
  },
  inputFilled: {borderColor: '#e5383b'},
  inputError: {borderColor: '#e5383b', backgroundColor: '#ffe0e0'},
  floatLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    fontSize: 11,
    color: '#828282',
    zIndex: 1,
  },
  inputText: {fontSize: 15, color: '#000'},
  errorMsg: {fontSize: 12, color: '#e5383b', marginTop: 4},

  /* Dropdown */
  dropdownList: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {fontSize: 14, color: '#e5383b'},

  /* Remark */
  remarkPad: {paddingVertical: 6, gap: 8},
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e5383b',
    borderRadius: 6,
    height: 46,
    paddingHorizontal: 12,
  },
  recordBtnText: {color: '#fff', fontSize: 13},
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff5f5',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5383b',
  },
  recordingLabel: {flex: 1, fontSize: 15, color: '#e5383b', fontWeight: '500'},
  stopBtn: {
    width: 36,
    height: 32,
    backgroundColor: '#e5383b',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Media grid */
  mediaGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  audioCard: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  audioPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioDuration: {fontSize: 10, color: '#e5383b', fontWeight: '500', marginTop: 4},
  imageCard: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imageFull: {width: 80, height: 80},
  mediaDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    backgroundColor: '#e5383b',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaDeleteX: {color: '#fff', fontSize: 10, fontWeight: '700'},
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  addImageCount: {fontSize: 10, color: '#828282', marginTop: 2},

  /* Action buttons */
  addAnotherBtn: {
    height: 52,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderStyle: 'dashed',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5383b',
    letterSpacing: 0.5,
  },
  sendBtn: {
    height: 52,
    backgroundColor: '#e5383b',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: 1},

  /* Success overlay */
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
});
