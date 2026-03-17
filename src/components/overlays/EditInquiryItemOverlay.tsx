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
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Svg, {Path, Rect} from 'react-native-svg';
import FloatingInput from '../ui/FloatingInput';
import type {InquiryItemResponse} from '../../services/api';
import {SERVER_ORIGIN} from '../../services/api';
import AppAlert, {AlertState} from './AppAlert';

export interface InquiryItemForm {
  id?: string;
  itemName: string;
  preferredBrand: string;
  quantity: string;
  notes: string;
}

interface EditInquiryItemOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InquiryItemResponse;
  onSave?: (item: Partial<InquiryItemResponse>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const resolveUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('file://') || url.startsWith('content://')) return url;
  return `${SERVER_ORIGIN}/${url.replace(/^\//, '')}`;
};

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const MicIcon = () => (
  <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
    <Path d="M8 12C9.66 12 11 10.66 11 9V3C11 1.34 9.66 0 8 0C6.34 0 5 1.34 5 3V9C5 10.66 6.34 12 8 12ZM14 9C14 12.53 10.96 15.36 7.5 15.93V18H10V20H6V18H8.5V15.93C5.04 15.36 2 12.53 2 9H0C0 13.08 3.05 16.44 7 16.93V18H9V16.93C12.95 16.44 16 13.08 16 9H14Z" fill="white" />
  </Svg>
);

const StopIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="6" width="12" height="12" rx="2" fill="white" />
  </Svg>
);

const PlayIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M8 5V19L19 12L8 5Z" fill="white" />
  </Svg>
);

const PauseIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function EditInquiryItemOverlay({
  isOpen,
  onClose,
  item,
  onSave,
}: EditInquiryItemOverlayProps) {
  const [partName, setPartName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [remark, setRemark] = useState('');
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  // Audio
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [isServerAudio, setIsServerAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRecorderPlayerRef = useRef<typeof AudioRecorderPlayer | null>(null);
  if (!audioRecorderPlayerRef.current) audioRecorderPlayerRef.current = AudioRecorderPlayer;
  const arp = audioRecorderPlayerRef.current;
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeRef = useRef(0);

  // Images: track isServer so we resolve URLs for display
  const [images, setImages] = useState<{uri: string; isServer: boolean}[]>([]);

  // Reset state when item/isOpen changes
  useEffect(() => {
    if (isOpen) {
      setPartName(item?.partName || '');
      setBrand(item?.preferredBrand || '');
      setQuantity(item?.quantity?.toString() || '1');
      setRemark(item?.remark || '');
      setAudioPath(item?.audioUrl || null);
      setIsServerAudio(!!item?.audioUrl);
      setAudioDuration(item?.audioDuration || 0);
      setImages(
        ([item?.image1Url, item?.image2Url, item?.image3Url] as (string | null | undefined)[])
          .filter(Boolean)
          .map(u => ({uri: u as string, isServer: true})),
      );
      setIsRecording(false);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setIsPlaying(false);
    }
  }, [isOpen, item]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (isRecording) {
        arp?.stopRecorder().catch(() => {});
        if (recordingTimer.current) { clearInterval(recordingTimer.current); recordingTimer.current = null; }
      }
      arp?.stopPlayer().catch(() => {});
    }
  }, [isOpen]);

  // ── Audio ─────────────────────────────────────────────────────────────────

  const startRecording = async () => {
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
      await arp?.startRecorder();
      recordingTimeRef.current = 0;
      setRecordingTime(0);
      setIsRecording(true);
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
      const path = await arp?.stopRecorder();
      arp?.removeRecordBackListener();
      if (recordingTimer.current) { clearInterval(recordingTimer.current); recordingTimer.current = null; }
      setIsRecording(false);
      setAudioPath(path || null);
      setIsServerAudio(false);
      setAudioDuration(recordingTimeRef.current);
    } catch { /* ignore */ }
  };

  const togglePlayback = async () => {
    if (!audioPath) return;
    const fullUri = isServerAudio ? resolveUrl(audioPath) ?? audioPath : audioPath;
    try {
      if (isPlaying) {
        await arp?.stopPlayer();
        arp?.removePlayBackListener();
        setIsPlaying(false);
      } else {
        await arp?.startPlayer(fullUri);
        setIsPlaying(true);
        arp?.addPlayBackListener(e => {
          if (e.duration > 0 && e.currentPosition >= e.duration) {
            arp?.stopPlayer();
            arp?.removePlayBackListener();
            setIsPlaying(false);
          }
        });
      }
    } catch { /* ignore */ }
  };

  const deleteAudio = () => {
    arp?.stopPlayer().catch(() => {});
    setAudioPath(null);
    setIsServerAudio(false);
    setAudioDuration(0);
    setIsPlaying(false);
  };

  // ── Images ────────────────────────────────────────────────────────────────

  const pickImage = () => {
    if (images.length >= 3) return;
    launchImageLibrary({mediaType: 'photo', selectionLimit: 3 - images.length, quality: 0.8}, res => {
      if (res.didCancel || res.errorCode) return;
      const picked = (res.assets || []).map(a => ({uri: a.uri || '', isServer: false})).filter(a => a.uri);
      setImages(prev => [...prev, ...picked].slice(0, 3));
    });
  };

  const deleteImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!partName.trim()) return;
    onSave?.({
      partName,
      preferredBrand: brand,
      quantity: parseInt(quantity, 10) || 1,
      remark,
      audioUrl: audioPath || null,
      audioDuration,
      image1Url: images[0]?.uri || null,
      image2Url: images[1]?.uri || null,
      image3Url: images[2]?.uri || null,
    });
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{item?.id ? 'Edit Part' : 'Add Part'}</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <FloatingInput label="Part Name" value={partName} onChange={setPartName} required />
          <FloatingInput label="Preferred Brand" value={brand} onChange={setBrand} />
          <FloatingInput label="Quantity" value={quantity} onChange={setQuantity} keyboardType="numeric" />

          <Text style={styles.sectionLabel}>Remark</Text>
          <TextInput
            value={remark}
            onChangeText={setRemark}
            placeholder="Additional remarks..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            style={styles.notesInput}
            textAlignVertical="top"
          />

          {/* ── Audio section ──────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Audio</Text>
          <View style={styles.mediaSubSection}>
            {/* No audio yet — show record button */}
            {!audioPath && !isRecording && (
              <TouchableOpacity style={styles.recordBtn} onPress={startRecording} activeOpacity={0.85}>
                <MicIcon />
                <Text style={styles.recordBtnText}>Record Audio</Text>
              </TouchableOpacity>
            )}

            {/* Recording in progress */}
            {isRecording && (
              <View style={styles.recordingBar}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording... {formatDuration(recordingTime)}</Text>
                <TouchableOpacity onPress={stopRecording} style={styles.stopBtn} activeOpacity={0.8}>
                  <StopIcon />
                </TouchableOpacity>
              </View>
            )}

            {/* Audio exists — playback row */}
            {!!audioPath && !isRecording && (
              <View style={styles.audioPlayerRow}>
                <TouchableOpacity onPress={togglePlayback} style={styles.audioPlayBtn} activeOpacity={0.8}>
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </TouchableOpacity>
                <View style={styles.audioInfo}>
                  <Text style={styles.audioLabel}>
                    {isServerAudio ? 'Existing Recording' : `Recorded — ${formatDuration(audioDuration)}`}
                  </Text>
                </View>
                <TouchableOpacity onPress={deleteAudio} style={styles.audioDeleteBtn} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <CloseSmIcon />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Photos section ─────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, {marginTop: 16}]}>Photos</Text>
          <View style={styles.mediaSubSection}>
            <View style={styles.imagesRow}>
              {images.map((img, idx) => (
                <View key={idx} style={styles.imageThumb}>
                  <Image
                    source={{uri: img.isServer ? resolveUrl(img.uri) ?? img.uri : img.uri}}
                    style={styles.thumbImg}
                    resizeMode="cover"
                  />
                  <TouchableOpacity onPress={() => deleteImage(idx)} style={styles.thumbDelete}>
                    <CloseSmIcon />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 3 && (
                <TouchableOpacity onPress={pickImage} style={styles.addPhotoBtn} activeOpacity={0.8}>
                  <CameraIcon />
                  <Text style={styles.addPhotoText}>{images.length}/3</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!partName.trim()}
          style={[styles.saveBtn, !partName.trim() && styles.disabledBtn]}
          activeOpacity={0.85}>
          <Text style={styles.saveText}>SAVE CHANGES</Text>
        </TouchableOpacity>
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
  backdrop: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingBottom: 2, paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  title: {fontSize: 20, fontWeight: '700', color: '#e5383b', marginBottom: 16},
  scrollView: {marginBottom: 70},

  sectionLabel: {fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8, marginTop: 4},
  notesInput: {
    borderWidth: 1, borderColor: '#d4d9e3', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#1a1a1a',
    minHeight: 80, marginBottom: 8,
  },

  mediaSubSection: {marginBottom: 4},

  // Record button
  recordBtn: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e5383b', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 11, alignSelf: 'flex-start'},
  recordBtnText: {color: '#fff', fontSize: 14, fontWeight: '600'},

  // Recording bar
  recordingBar: {flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e5383b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff5f5'},
  recordingDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#e5383b'},
  recordingText: {flex: 1, fontSize: 14, color: '#e5383b', fontWeight: '500'},
  stopBtn: {width: 32, height: 32, borderRadius: 6, backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center'},

  // Audio player row
  audioPlayerRow: {flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e5383b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff5f5'},
  audioPlayBtn: {width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center'},
  audioInfo: {flex: 1},
  audioLabel: {fontSize: 13, color: '#e5383b', fontWeight: '500'},
  audioDeleteBtn: {width: 22, height: 22, borderRadius: 11, backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center'},

  // Images
  imagesRow: {flexDirection: 'row', gap: 10, flexWrap: 'wrap'},
  imageThumb: {width: 72, height: 72, borderRadius: 8, overflow: 'hidden', position: 'relative'},
  thumbImg: {width: 72, height: 72},
  thumbDelete: {position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center'},
  addPhotoBtn: {width: 72, height: 72, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d3d3d3', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#fafafa'},
  addPhotoText: {fontSize: 11, color: '#828282'},

  // Save
  saveBtn: {height: 52, borderRadius: 8, backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center', marginTop: 8},
  disabledBtn: {backgroundColor: '#d1d5db'},
  saveText: {fontSize: 16, fontWeight: '600', color: '#fff'},
});
