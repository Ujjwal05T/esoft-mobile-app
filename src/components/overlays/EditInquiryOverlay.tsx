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
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {launchImageLibrary} from 'react-native-image-picker';
import AppAlert, {AlertState} from './AppAlert';
import {
  updateInquiryItemsWithFiles,
  type InquiryItemResponse,
  type UpdateInquiryItemWithFilesData,
  SERVER_ORIGIN,
} from '../../services/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MediaItem {
  uri: string;
  name: string;
  isServer: boolean; // true = existing server URL, false = new local file
}

interface PartItem {
  id: string;
  itemId?: number; // server DB id — present for existing items, absent for new ones
  partName: string;
  preferredBrand: string;
  afterMarketBrandName: string;
  quantity: string;
  remark: string;
  isExpanded: boolean;
  hasAttemptedSubmit: boolean;
  // Audio: either a new local recording OR an existing server URL, not both
  audioUri: string | null;
  isServerAudio: boolean;
  audioDuration: number;
  // Images
  images: (MediaItem | null)[];
  isBrandDropdownOpen: boolean;
}

interface EditInquiryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  inquiryId: number;
  initialItems: InquiryItemResponse[];
  onSuccess: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const BRAND_OPTIONS = ['OEM - Original Brands', 'After Market'];

const generateId = () => `part-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptyPart = (): PartItem => ({
  id: generateId(),
  partName: '',
  preferredBrand: '',
  afterMarketBrandName: '',
  quantity: '',
  remark: '',
  isExpanded: false,
  hasAttemptedSubmit: false,
  audioUri: null,
  isServerAudio: false,
  audioDuration: 0,
  images: [null, null, null],
  isBrandDropdownOpen: false,
});

const fromInquiryItem = (item: InquiryItemResponse): PartItem => ({
  id: String(item.id),
  itemId: item.id,
  partName: item.partName,
  preferredBrand: item.preferredBrand,
  afterMarketBrandName: item.afterMarketBrandName || '',
  quantity: String(item.quantity),
  remark: item.remark || '',
  isExpanded: false,
  hasAttemptedSubmit: false,
  audioUri: item.audioUrl || null,
  isServerAudio: !!item.audioUrl,
  audioDuration: item.audioDuration || 0,
  images: [
    item.image1Url ? {uri: item.image1Url, name: 'image1.jpg', isServer: true} : null,
    item.image2Url ? {uri: item.image2Url, name: 'image2.jpg', isServer: true} : null,
    item.image3Url ? {uri: item.image3Url, name: 'image3.jpg', isServer: true} : null,
  ],
  isBrandDropdownOpen: false,
});

// S3 images are full https URLs; local picks are file:// URIs — both work directly
const resolveUri = (img: MediaItem) => img.uri;

const resolveAudioUri = (uri: string, isServer: boolean) =>
  !isServer ? uri : uri.startsWith('http') ? uri : `${SERVER_ORIGIN}/${uri.replace(/^\//, '')}`;

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ── Icons ──────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronIcon = ({rotated = false}: {rotated?: boolean}) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
    style={rotated ? {transform: [{rotate: '180deg'}]} : undefined}>
    <Path d="M7 10L12 15L17 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width={16} height={18} viewBox="0 0 18 20" fill="none">
    <Path d="M1 5H17M7 9V15M11 9V15M2 5L3 17C3 18.1 3.9 19 5 19H13C14.1 19 15 18.1 15 17L16 5M6 5V2C6 1.4 6.4 1 7 1H11C11.6 1 12 1.4 12 2V5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MicIcon = () => (
  <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
    <Path d="M8 12C9.66 12 11 10.66 11 9V3C11 1.34 9.66 0 8 0C6.34 0 5 1.34 5 3V9C5 10.66 6.34 12 8 12ZM14 9C14 12.53 10.96 15.36 7.5 15.93V18H10V20H6V18H8.5V15.93C5.04 15.36 2 12.53 2 9H0C0 13.08 3.05 16.44 7 16.93V18H9V16.93C12.95 16.44 16 13.08 16 9H14Z" fill="white" />
  </Svg>
);

const StopIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="6" width="12" height="12" rx="2" fill="white" />
  </Svg>
);

const PlayIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M8 5V19L19 12L8 5Z" fill="white" />
  </Svg>
);

const PauseIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="5" width="4" height="14" rx="1" fill="white" />
    <Rect x="14" y="5" width="4" height="14" rx="1" fill="white" />
  </Svg>
);

const CameraIcon = () => (
  <Svg width={20} height={18} viewBox="0 0 24 22" fill="none">
    <Path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V7C1 6.46957 1.21071 5.96086 1.58579 5.58579C1.96086 5.21071 2.46957 5 3 5H7L9 1H15L17 5H21C21.5304 5 22.0391 5.21071 22.4142 5.58579C22.7893 5.96086 23 6.46957 23 7V19Z" stroke="#e5383b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="#e5383b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CloseSmIcon = () => (
  <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
    <Path d="M9 3L3 9M3 3L9 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke="#e5383b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Component ──────────────────────────────────────────────────────────────────

export default function EditInquiryOverlay({
  isOpen,
  onClose,
  inquiryId,
  initialItems,
  onSuccess,
}: EditInquiryOverlayProps) {
  const [parts, setParts] = useState<PartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  // Shared recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPartId, setRecordingPartId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const audioRecorderPlayerRef = useRef<typeof AudioRecorderPlayer | null>(null);
  if (!audioRecorderPlayerRef.current) audioRecorderPlayerRef.current = AudioRecorderPlayer;
  const audioPlayer = audioRecorderPlayerRef.current;
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeRef = useRef(0);
  const recordingPartIdRef = useRef<string | null>(null);

  // Shared playback state
  const [playingPartId, setPlayingPartId] = useState<string | null>(null);

  // Init on open
  useEffect(() => {
    if (isOpen) {
      setParts(initialItems.length > 0 ? initialItems.map(fromInquiryItem) : [createEmptyPart()]);
    }
  }, [isOpen, initialItems]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      if (isRecording) {
        audioPlayer?.stopRecorder().catch(() => {});
        if (recordingTimer.current) clearInterval(recordingTimer.current);
      }
      audioPlayer?.stopPlayer().catch(() => {});
      setIsRecording(false);
      setRecordingPartId(null);
      recordingPartIdRef.current = null;
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setPlayingPartId(null);
    }
  }, [isOpen]);

  // ── Part helpers ─────────────────────────────────────────────────────────────

  const updatePart = (id: string, updates: Partial<PartItem>) =>
    setParts(prev => prev.map(p => (p.id === id ? {...p, ...updates} : p)));

  const toggleExpand = (id: string) =>
    setParts(prev => prev.map(p => (p.id === id ? {...p, isExpanded: !p.isExpanded} : p)));

  const deletePart = (id: string) => setParts(prev => prev.filter(p => p.id !== id));

  const addPart = () =>
    setParts(prev => [...prev.map(p => ({...p, isExpanded: false})), createEmptyPart()]);

  // ── Audio ────────────────────────────────────────────────────────────────────

  const startRecording = async (partId: string) => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {title: 'Audio Permission', message: 'Microphone access needed to record audio.', buttonNeutral: 'Ask Me Later', buttonNegative: 'Cancel', buttonPositive: 'OK'},
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setAppAlert({type: 'warning', title: 'Permission Denied', message: 'Microphone permission is required.'});
          return;
        }
      }
      await audioPlayer?.startRecorder();
      recordingTimeRef.current = 0;
      recordingPartIdRef.current = partId;
      setIsRecording(true);
      setRecordingPartId(partId);
      setRecordingTime(0);
      recordingTimer.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch {
      setAppAlert({type: 'error', message: 'Could not start recording.'});
    }
  };

  const stopRecording = async () => {
    try {
      const path = await audioPlayer?.stopRecorder();
      if (recordingTimer.current) { clearInterval(recordingTimer.current); recordingTimer.current = null; }
      const partId = recordingPartIdRef.current;
      const duration = recordingTimeRef.current;
      if (partId) updatePart(partId, {audioUri: path ?? null, isServerAudio: false, audioDuration: duration});
      setIsRecording(false);
      setRecordingPartId(null);
      recordingPartIdRef.current = null;
    } catch { /* ignore */ }
  };

  const clearAudio = (partId: string) =>
    updatePart(partId, {audioUri: null, isServerAudio: false, audioDuration: 0});

  const togglePlayback = async (partId: string, uri: string, isServer: boolean) => {
    const fullUri = resolveAudioUri(uri, isServer);
    try {
      if (playingPartId === partId) {
        await audioPlayer?.stopPlayer();
        audioPlayer?.removePlayBackListener();
        setPlayingPartId(null);
      } else {
        if (playingPartId) { await audioPlayer?.stopPlayer(); audioPlayer?.removePlayBackListener(); }
        await audioPlayer?.startPlayer(fullUri);
        setPlayingPartId(partId);
        audioPlayer?.addPlayBackListener(e => {
          if (e.duration > 0 && e.currentPosition >= e.duration) {
            audioPlayer?.stopPlayer();
            audioPlayer?.removePlayBackListener();
            setPlayingPartId(null);
          }
        });
      }
    } catch { /* ignore */ }
  };

  // ── Images ───────────────────────────────────────────────────────────────────

  const pickImage = (partId: string) => {
    launchImageLibrary({mediaType: 'photo', quality: 0.8}, res => {
      if (!res.didCancel && !res.errorCode && res.assets?.[0]) {
        const a = res.assets[0];
        setParts(prev => {
          const part = prev.find(p => p.id === partId);
          if (!part) return prev;
          const slot = part.images.findIndex(img => !img);
          if (slot === -1) return prev;
          const imgs = [...part.images] as PartItem['images'];
          imgs[slot] = {uri: a.uri!, name: a.fileName || `photo_${Date.now()}.jpg`, isServer: false};
          return prev.map(p => (p.id === partId ? {...p, images: imgs} : p));
        });
      }
    });
  };

  const deleteImage = (partId: string, idx: number) =>
    setParts(prev => prev.map(p => {
      if (p.id !== partId) return p;
      const imgs = [...p.images] as PartItem['images'];
      imgs[idx] = null;
      return {...p, images: imgs};
    }));

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    let valid = true;
    setParts(prev => prev.map(p => {
      const hasErr = !p.partName.trim() || !p.preferredBrand || (p.preferredBrand === 'After Market' && !p.afterMarketBrandName.trim()) || !p.quantity.trim();
      if (hasErr) valid = false;
      return {...p, hasAttemptedSubmit: true, isExpanded: hasErr ? true : p.isExpanded};
    }));
    if (!valid) return;

    setSubmitting(true);
    try {
      const audioFiles: {uri: string; name: string; type: string}[] = [];
      const imageFiles: {uri: string; name: string; type: string}[] = [];

      const items: UpdateInquiryItemWithFilesData[] = parts.map(p => {
        const hasNewAudio = !!p.audioUri && !p.isServerAudio;
        if (hasNewAudio && p.audioUri) audioFiles.push({uri: p.audioUri, name: 'audio.m4a', type: 'audio/m4a'});

        const imgs = p.images;
        const hasNewImg1 = !!imgs[0] && !imgs[0].isServer;
        const hasNewImg2 = !!imgs[1] && !imgs[1].isServer;
        const hasNewImg3 = !!imgs[2] && !imgs[2].isServer;
        if (hasNewImg1 && imgs[0]) imageFiles.push({uri: imgs[0].uri, name: imgs[0].name, type: 'image/jpeg'});
        if (hasNewImg2 && imgs[1]) imageFiles.push({uri: imgs[1].uri, name: imgs[1].name, type: 'image/jpeg'});
        if (hasNewImg3 && imgs[2]) imageFiles.push({uri: imgs[2].uri, name: imgs[2].name, type: 'image/jpeg'});

        return {
          id: p.itemId,
          partName: p.partName,
          preferredBrand: p.preferredBrand,
          afterMarketBrandName: p.preferredBrand === 'After Market' ? p.afterMarketBrandName : undefined,
          quantity: parseInt(p.quantity, 10) || 1,
          remark: p.remark,
          audioDuration: p.audioDuration || undefined,
          hasNewAudio,
          audioUrl: !hasNewAudio ? (p.audioUri ?? undefined) : undefined,
          hasNewImage1: hasNewImg1,
          image1Url: !hasNewImg1 ? (imgs[0]?.uri ?? undefined) : undefined,
          hasNewImage2: hasNewImg2,
          image2Url: !hasNewImg2 ? (imgs[1]?.uri ?? undefined) : undefined,
          hasNewImage3: hasNewImg3,
          image3Url: !hasNewImg3 ? (imgs[2]?.uri ?? undefined) : undefined,
        };
      });

      const result = await updateInquiryItemsWithFiles(inquiryId, items, audioFiles, imageFiles);
      if (result.success) {
        setAppAlert({type: 'success', message: 'Inquiry updated successfully', onDone: () => { onClose(); onSuccess(); }});
      } else {
        setAppAlert({type: 'error', message: result.error || 'Failed to update inquiry'});
      }
    } catch {
      setAppAlert({type: 'error', message: 'Failed to update inquiry'});
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render part ──────────────────────────────────────────────────────────────

  const renderPart = (part: PartItem, index: number) => {
    const isThisRecording = isRecording && recordingPartId === part.id;
    const isThisPlaying = playingPartId === part.id;
    const filledImages = part.images.filter(Boolean);
    const title = part.partName.trim() || `Part ${index + 1}`;

    return (
      <View key={part.id} style={styles.accordionWrap}>
        {/* Accordion header */}
        <TouchableOpacity onPress={() => toggleExpand(part.id)} style={styles.accordionHeader} activeOpacity={0.85}>
          <View style={styles.accordionLeft}>
            <Text style={styles.accordionTitle} numberOfLines={1}>{title}</Text>
            {!!part.quantity && (
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyBadgeText}>Qty: {part.quantity}</Text>
              </View>
            )}
          </View>
          <View style={styles.accordionRight}>
            {parts.length > 1 && (
              <TouchableOpacity onPress={() => deletePart(part.id)} style={styles.trashBtn} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <TrashIcon />
              </TouchableOpacity>
            )}
            <ChevronIcon rotated={part.isExpanded} />
          </View>
        </TouchableOpacity>

        {part.isExpanded && (
          <View style={styles.accordionContent}>
            {/* Part Name */}
            <View style={styles.fieldWrap}>
              <View style={[styles.inputBox, !!part.partName && styles.inputFilled, part.hasAttemptedSubmit && !part.partName.trim() && styles.inputError]}>
                {!!part.partName && <Text style={styles.floatLabel}>Part Name</Text>}
                <TextInput value={part.partName} onChangeText={v => updatePart(part.id, {partName: v})} placeholder="Part Name" placeholderTextColor="#828282" style={styles.inputText} />
              </View>
              {part.hasAttemptedSubmit && !part.partName.trim() && <Text style={styles.errorMsg}>Part name is required</Text>}
            </View>

            {/* Brand */}
            <View style={[styles.fieldWrap, part.isBrandDropdownOpen && {zIndex: 10}]}>
              <TouchableOpacity
                onPress={() => updatePart(part.id, {isBrandDropdownOpen: !part.isBrandDropdownOpen})}
                style={[styles.inputBox, styles.row, !!part.preferredBrand && styles.inputFilled, part.hasAttemptedSubmit && !part.preferredBrand && styles.inputError]}>
                {!!part.preferredBrand && <Text style={styles.floatLabel}>Preferred Brand</Text>}
                <Text style={[styles.inputText, {flex: 1}, !part.preferredBrand && {color: '#828282'}]}>
                  {part.preferredBrand || 'Preferred Brand'}
                </Text>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M7 10L12 15L17 10" stroke="#e5383b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
              {part.isBrandDropdownOpen && (
                <View style={styles.dropdown}>
                  {BRAND_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt} onPress={() => updatePart(part.id, {preferredBrand: opt, isBrandDropdownOpen: false})} style={styles.dropdownItem}>
                      <Text style={styles.dropdownText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {part.hasAttemptedSubmit && !part.preferredBrand && <Text style={styles.errorMsg}>Brand is required</Text>}
            </View>

            {/* After Market Brand Name */}
            {part.preferredBrand === 'After Market' && (
              <View style={styles.fieldWrap}>
                <View style={[styles.inputBox, !!part.afterMarketBrandName && styles.inputFilled, part.hasAttemptedSubmit && !part.afterMarketBrandName.trim() && styles.inputError]}>
                  {!!part.afterMarketBrandName && <Text style={styles.floatLabel}>Brand Name</Text>}
                  <TextInput
                    value={part.afterMarketBrandName}
                    onChangeText={v => updatePart(part.id, {afterMarketBrandName: v})}
                    placeholder="Brand Name"
                    placeholderTextColor="#828282"
                    style={styles.inputText}
                  />
                </View>
                {part.hasAttemptedSubmit && !part.afterMarketBrandName.trim() && <Text style={styles.errorMsg}>Brand name is required</Text>}
              </View>
            )}

            {/* Quantity */}
            <View style={styles.fieldWrap}>
              <View style={[styles.inputBox, !!part.quantity && styles.inputFilled, part.hasAttemptedSubmit && !part.quantity.trim() && styles.inputError]}>
                {!!part.quantity && <Text style={styles.floatLabel}>Quantity</Text>}
                <TextInput value={part.quantity} onChangeText={v => updatePart(part.id, {quantity: v})} placeholder="Quantity" placeholderTextColor="#828282" keyboardType="numeric" style={styles.inputText} />
              </View>
              {part.hasAttemptedSubmit && !part.quantity.trim() && <Text style={styles.errorMsg}>Quantity is required</Text>}
            </View>

            {/* Remark + inline record button */}
            <View style={styles.fieldWrap}>
              {!isThisRecording && !part.audioUri && (
                <View style={[styles.inputBox, styles.row, styles.remarkPad, !!part.remark && styles.inputFilled]}>
                  {!!part.remark && <Text style={styles.floatLabel}>Remark</Text>}
                  <TextInput
                    value={part.remark}
                    onChangeText={v => updatePart(part.id, {remark: v})}
                    placeholder="Remark (optional)"
                    placeholderTextColor="#828282"
                    style={[styles.inputText, {flex: 1}]}
                  />
                  <TouchableOpacity
                    onPress={() => startRecording(part.id)}
                    disabled={isRecording && recordingPartId !== part.id}
                    style={[styles.recordBtn, isRecording && recordingPartId !== part.id && styles.recordBtnDisabled]}>
                    <MicIcon />
                    <Text style={styles.recordBtnText}>Record</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isThisRecording && (
                <View style={styles.recordingRow}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingLabel}>Recording... {formatTime(recordingTime)}</Text>
                  <TouchableOpacity onPress={stopRecording} style={styles.stopBtn}>
                    <StopIcon />
                  </TouchableOpacity>
                </View>
              )}

              {!!part.audioUri && !isThisRecording && (
                <View style={[styles.inputBox, !!part.remark && styles.inputFilled]}>
                  {!!part.remark && <Text style={styles.floatLabel}>Remark</Text>}
                  <TextInput
                    value={part.remark}
                    onChangeText={v => updatePart(part.id, {remark: v})}
                    placeholder="Remark (optional)"
                    placeholderTextColor="#828282"
                    style={styles.inputText}
                  />
                </View>
              )}
            </View>

            {/* ── Media grid ─────────────────────────────────────────────── */}
            <View style={styles.mediaGrid}>
              {/* Audio card */}
              {!!part.audioUri && (
                <View style={styles.audioCard}>
                  <TouchableOpacity
                    onPress={() => togglePlayback(part.id, part.audioUri!, part.isServerAudio)}
                    style={styles.audioPlayBtn}>
                    {isThisPlaying ? <PauseIcon /> : <PlayIcon />}
                  </TouchableOpacity>
                  <Text style={styles.audioDuration}>
                    {part.isServerAudio ? 'Audio' : formatTime(part.audioDuration)}
                  </Text>
                  <TouchableOpacity onPress={() => clearAudio(part.id)} style={styles.mediaDeleteBtn}>
                    <Text style={styles.mediaDeleteX}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Image cards */}
              {part.images.map((img, imgIdx) =>
                img ? (
                  <View key={imgIdx} style={styles.imageCard}>
                    <Image source={{uri: resolveUri(img)}} style={styles.imageFull} resizeMode="cover" />
                    <TouchableOpacity onPress={() => deleteImage(part.id, imgIdx)} style={styles.mediaDeleteBtn}>
                      <Text style={styles.mediaDeleteX}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : null,
              )}

              {/* Add image button */}
              {filledImages.length < 3 && (
                <TouchableOpacity onPress={() => pickImage(part.id)} style={styles.addImageBtn}>
                  <PlusIcon />
                  <Text style={styles.addImageCount}>{filledImages.length}/3 img</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Parts</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{parts.length} {parts.length === 1 ? 'Part' : 'Parts'}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.formPad}>
            {parts.map((p, i) => renderPart(p, i))}

            <TouchableOpacity onPress={addPart} style={styles.addAnotherBtn} activeOpacity={0.8}>
              <PlusIcon />
              <Text style={styles.addAnotherText}>ADD ANOTHER PART</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={submitting}
              style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
              activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>
                {submitting ? 'Saving...' : `SAVE CHANGES (${parts.length} ${parts.length === 1 ? 'PART' : 'PARTS'})`}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <AppAlert
        isOpen={!!appAlert}
        type={appAlert?.type ?? 'info'}
        title={appAlert?.title}
        message={appAlert?.message ?? ''}
        onClose={() => { const d = appAlert?.onDone; setAppAlert(null); d?.(); }}
        onConfirm={appAlert?.onConfirm ? () => { const c = appAlert.onConfirm!; setAppAlert(null); c(); } : undefined}
      />
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)'},
  sheet: {position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%'},
  handle: {width: 40, height: 4, backgroundColor: '#dadada', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4},

  header: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  backBtn: {padding: 4},
  headerTitle: {flex: 1, fontSize: 20, fontWeight: '700', color: '#000'},
  countBadge: {backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4},
  countText: {fontSize: 13, color: '#828282', fontWeight: '500'},

  formPad: {paddingHorizontal: 20, paddingBottom: 40, gap: 12, paddingTop: 16},

  // Accordion
  accordionWrap: {borderRadius: 10, overflow: 'visible'},
  accordionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#e5383b', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12},
  accordionLeft: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1},
  accordionTitle: {fontSize: 15, fontWeight: '600', color: '#fff', flex: 1},
  qtyBadge: {backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2},
  qtyBadgeText: {fontSize: 12, color: '#fff'},
  accordionRight: {flexDirection: 'row', alignItems: 'center', gap: 10},
  trashBtn: {padding: 2},
  accordionContent: {paddingTop: 16, paddingHorizontal: 2, gap: 14, paddingBottom: 8},

  // Fields
  fieldWrap: {position: 'relative'},
  row: {flexDirection: 'row', alignItems: 'center'},
  inputBox: {borderWidth: 1, borderColor: '#d3d3d3', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, position: 'relative', minHeight: 50, justifyContent: 'center'},
  inputFilled: {borderColor: '#e5383b'},
  inputError: {borderColor: '#e5383b', backgroundColor: '#fff0f0'},
  floatLabel: {position: 'absolute', top: -8, left: 10, backgroundColor: '#fff', paddingHorizontal: 4, fontSize: 11, color: '#828282', zIndex: 1},
  inputText: {fontSize: 15, color: '#1a1a1a', padding: 0},
  errorMsg: {fontSize: 12, color: '#e5383b', marginTop: 4, marginLeft: 2},
  // Dropdown
  dropdown: {borderWidth: 1, borderColor: '#e5383b', borderRadius: 8, marginTop: 4, backgroundColor: '#fff', elevation: 6, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.12, shadowRadius: 4, zIndex: 20},
  dropdownItem: {paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5'},
  dropdownText: {fontSize: 14, color: '#1a1a1a'},

  // Remark + record
  remarkPad: {paddingVertical: 6, gap: 8},
  recordBtn: {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e5383b', borderRadius: 6, height: 46, paddingHorizontal: 12},
  recordBtnDisabled: {opacity: 0.5},
  recordBtnText: {color: '#fff', fontSize: 13},

  // Recording row
  recordingRow: {flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#e5383b', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff5f5'},
  recordingDot: {width: 12, height: 12, borderRadius: 6, backgroundColor: '#e5383b'},
  recordingLabel: {flex: 1, fontSize: 15, color: '#e5383b', fontWeight: '500'},
  stopBtn: {width: 36, height: 32, backgroundColor: '#e5383b', borderRadius: 6, alignItems: 'center', justifyContent: 'center'},

  // Media grid
  mediaGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  audioCard: {width: 80, height: 80, borderRadius: 8, backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#e5383b', alignItems: 'center', justifyContent: 'center', position: 'relative'},
  audioPlayBtn: {width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center'},
  audioDuration: {fontSize: 10, color: '#e5383b', fontWeight: '500', marginTop: 4},
  imageCard: {width: 80, height: 80, borderRadius: 8, overflow: 'hidden', position: 'relative'},
  imageFull: {width: 80, height: 80},
  mediaDeleteBtn: {position: 'absolute', top: 4, right: 4, width: 20, height: 20, backgroundColor: '#e5383b', borderRadius: 4, alignItems: 'center', justifyContent: 'center'},
  mediaDeleteX: {color: '#fff', fontSize: 10, fontWeight: '700'},
  addImageBtn: {width: 80, height: 80, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa'},
  addImageCount: {fontSize: 10, color: '#828282', marginTop: 2},

  // Add part + save
  addAnotherBtn: {height: 50, borderWidth: 1.5, borderColor: '#e5383b', borderStyle: 'dashed', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  addAnotherText: {fontSize: 14, fontWeight: '600', color: '#e5383b', letterSpacing: 0.5},
  saveBtn: {height: 52, backgroundColor: '#e5383b', borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  saveBtnDisabled: {backgroundColor: '#c0c0c0'},
  saveBtnText: {color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5},
});
