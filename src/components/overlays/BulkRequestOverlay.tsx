import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import SheetModal from '../ui/SheetModal';
import Svg, {Path, Rect} from 'react-native-svg';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {launchImageLibrary} from 'react-native-image-picker';
import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {launchCameraWithPermission} from '../../utils/cameraPermission';
import ImagePickerActionSheet from '../ui/ImagePickerActionSheet';
import AppAlert, {AlertState} from './AppAlert';
import {useTranslation} from 'react-i18next';
import type {BulkRequestData, InquiryResponse} from '../../services/api';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // keep in sync with the backend limit

interface PickedFile {
  uri: string;
  name: string;
  type: string;
  kind: 'image' | 'pdf';
}

interface BulkRequestOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  // Resolves with the API result; the parent screen knows which vehicle/visit this is for
  onSubmit: (data: BulkRequestData) => Promise<{success: boolean; error?: string; data?: InquiryResponse}>;
  // Called after the customer dismisses the success message (lets the caller close its own sheet)
  onSuccess?: () => void;
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const MicIcon = ({color = '#e5383b'}: {color?: string}) => (
  <Svg width={18} height={22} viewBox="0 0 16 20" fill="none">
    <Path
      d="M8 12C9.66 12 11 10.66 11 9V3C11 1.34 9.66 0 8 0C6.34 0 5 1.34 5 3V9C5 10.66 6.34 12 8 12ZM14 9C14 12.53 10.96 15.36 7.5 15.93V18H10V20H6V18H8.5V15.93C5.04 15.36 2 12.53 2 9H0C0 13.08 3.05 16.44 7 16.93V18H9V16.93C12.95 16.44 16 13.08 16 9H14Z"
      fill={color}
    />
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
    <Path
      d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V7C1 6.46957 1.21071 5.96086 1.58579 5.58579C1.96086 5.21071 2.46957 5 3 5H7L9 1H15L17 5H21C21.5304 5 22.0391 5.21071 22.4142 5.58579C22.7893 5.96086 23 6.46957 23 7V19Z"
      stroke="#e5383b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z"
      stroke="#e5383b"
      strokeWidth="2"
    />
  </Svg>
);

const PdfIcon = ({size = 20}: {size?: number}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke="#e5383b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2V8H20" stroke="#e5383b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function BulkRequestOverlay({isOpen, onClose, onSubmit, onSuccess}: BulkRequestOverlayProps) {
  const {t} = useTranslation();
  const [text, setText] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeRef = useRef(0);
  const isRecordingRef = useRef(false);

  const stopTimer = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  /* Reset (and release the recorder/player) whenever the sheet closes */
  useEffect(() => {
    if (isOpen) return;
    stopTimer();
    if (isRecordingRef.current) {
      AudioRecorderPlayer.stopRecorder().catch(() => {});
      isRecordingRef.current = false;
    }
    AudioRecorderPlayer.stopPlayer().catch(() => {});
    setText('');
    setFile(null);
    setAudioPath(null);
    setAudioDuration(0);
    setIsRecording(false);
    setRecordingTime(0);
    setIsPlaying(false);
    setSubmitting(false);
  }, [isOpen]);

  useEffect(() => () => stopTimer(), []);

  /* ── Audio ─────────────────────────────────────────────────────────── */

  const startRecording = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
          title: 'Audio Recording Permission',
          message: 'This app needs access to your microphone to record audio.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setAppAlert({type: 'warning', title: 'Permission Denied', message: 'Audio recording permission is required.'});
          return;
        }
      }
      if (isPlaying) {
        await AudioRecorderPlayer.stopPlayer();
        setIsPlaying(false);
      }
      await AudioRecorderPlayer.startRecorder();
      isRecordingRef.current = true;
      recordingTimeRef.current = 0;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimer.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(s => s + 1);
      }, 1000);
    } catch (e) {
      console.error('startRecorder error', e);
      setAppAlert({type: 'error', message: 'Could not start recording. Please check permissions.'});
    }
  };

  const stopRecording = async () => {
    try {
      const path = await AudioRecorderPlayer.stopRecorder();
      stopTimer();
      isRecordingRef.current = false;
      setAudioPath(path);
      setAudioDuration(recordingTimeRef.current);
      setIsRecording(false);
    } catch (e) {
      console.error('stopRecorder error', e);
    }
  };

  const togglePlayback = async () => {
    if (!audioPath) return;
    try {
      if (isPlaying) {
        await AudioRecorderPlayer.stopPlayer();
        setIsPlaying(false);
      } else {
        await AudioRecorderPlayer.startPlayer(audioPath);
        setIsPlaying(true);
        AudioRecorderPlayer.addPlayBackListener(e => {
          if (e.currentPosition >= e.duration) setIsPlaying(false);
        });
      }
    } catch (e) {
      console.error('playback error', e);
    }
  };

  const deleteAudio = async () => {
    if (isPlaying) {
      await AudioRecorderPlayer.stopPlayer().catch(() => {});
      setIsPlaying(false);
    }
    setAudioPath(null);
    setAudioDuration(0);
  };

  /* ── Photo / PDF ───────────────────────────────────────────────────── */

  const tooLarge = () => setAppAlert({type: 'warning', message: t('bulk_request.file_too_large')});

  const handleImageSource = (source: 'camera' | 'gallery') => {
    setShowImageSheet(false);
    const onResult = (res: any) => {
      if (res.didCancel || res.errorCode || !res.assets?.[0]) return;
      const a = res.assets[0];
      if (a.fileSize && a.fileSize > MAX_FILE_BYTES) return tooLarge();
      setFile({
        uri: a.uri!,
        name: a.fileName || `photo_${Date.now()}.jpg`,
        type: a.type || 'image/jpeg',
        kind: 'image',
      });
    };
    if (source === 'camera') {
      launchCameraWithPermission({mediaType: 'photo', quality: 0.8, saveToPhotos: false}, onResult);
    } else {
      launchImageLibrary({mediaType: 'photo', quality: 0.8}, onResult);
    }
  };

  const pickPdf = async () => {
    try {
      // The system picker copies the chosen file into the app sandbox — no storage permission needed
      const [picked] = await pick({type: [types.pdf]});
      if (!picked) return;
      if (picked.size && picked.size > MAX_FILE_BYTES) return tooLarge();
      setFile({
        uri: picked.uri,
        name: picked.name || `document_${Date.now()}.pdf`,
        type: 'application/pdf',
        kind: 'pdf',
      });
    } catch (e) {
      if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) return;
      console.error('pdf pick error', e);
      setAppAlert({type: 'error', message: t('bulk_request.pick_failed')});
    }
  };

  /* ── Submit ────────────────────────────────────────────────────────── */

  const hasContent = !!text.trim() || !!file || !!audioPath;
  const canSubmit = hasContent && !isRecording && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await onSubmit({
        requestText: text.trim() || undefined,
        file: file ? {uri: file.uri, name: file.name, type: file.type} : undefined,
        audio: audioPath ? {uri: audioPath, name: `audio_${Date.now()}.m4a`, type: 'audio/mp4'} : undefined,
        audioDuration: audioPath ? audioDuration : undefined,
      });
      if (result.success) {
        setAppAlert({
          type: 'success',
          message: t('bulk_request.success', {number: result.data?.inquiryNumber ?? 'N/A'}),
          onDone: () => {
            onClose();
            onSuccess?.();
          },
        });
      } else {
        setAppAlert({type: 'error', message: result.error || t('bulk_request.failed')});
      }
    } catch {
      setAppAlert({type: 'error', message: t('bulk_request.failed')});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetModal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
        pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.pad}>
            <Text style={styles.title}>{t('bulk_request.title')}</Text>
            <Text style={styles.subtitle}>{t('bulk_request.subtitle')}</Text>

            {/* Open text */}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('bulk_request.text_placeholder')}
              placeholderTextColor="#828282"
              multiline
              textAlignVertical="top"
              maxLength={4000}
              style={[styles.textBox, !!text && styles.filled]}
            />

            {/* Voice note */}
            <Text style={styles.label}>{t('bulk_request.voice_note')}</Text>
            {audioPath ? (
              <View style={styles.audioCard}>
                <TouchableOpacity onPress={togglePlayback} style={styles.audioPlayBtn}>
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </TouchableOpacity>
                <Text style={styles.audioDuration}>{formatTime(audioDuration)}</Text>
                <View style={{flex: 1}} />
                <TouchableOpacity onPress={deleteAudio} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.removeX}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                style={[styles.actionBtn, isRecording && styles.recordingBtn]}
                activeOpacity={0.8}>
                <MicIcon color={isRecording ? '#fff' : '#e5383b'} />
                <Text style={[styles.actionBtnText, isRecording && {color: '#fff'}]}>
                  {isRecording
                    ? `${t('bulk_request.recording')}  ${formatTime(recordingTime)}`
                    : t('bulk_request.record')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Photo / PDF */}
            <Text style={styles.label}>{t('bulk_request.attach_title')}</Text>
            {file ? (
              <View style={styles.fileCard}>
                {file.kind === 'image' ? (
                  <Image source={{uri: file.uri}} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, styles.pdfThumb]}>
                    <PdfIcon size={26} />
                  </View>
                )}
                <Text style={styles.fileName} numberOfLines={2}>
                  {file.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setFile(null)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.removeX}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.row}>
                <TouchableOpacity
                  onPress={() => setShowImageSheet(true)}
                  style={[styles.actionBtn, styles.rowBtn]}
                  activeOpacity={0.8}>
                  <CameraIcon />
                  <Text style={styles.actionBtnText}>{t('bulk_request.photo')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickPdf} style={[styles.actionBtn, styles.rowBtn]} activeOpacity={0.8}>
                  <PdfIcon />
                  <Text style={styles.actionBtnText}>{t('bulk_request.pdf')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.submitBtn, !canSubmit && styles.submitDisabled]}
              activeOpacity={0.85}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>{t('bulk_request.submit')}</Text>
              )}
            </TouchableOpacity>
            {!hasContent && <Text style={styles.hint}>{t('bulk_request.need_one')}</Text>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

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
      />
      <ImagePickerActionSheet
        visible={showImageSheet}
        title={t('bulk_request.photo')}
        onCamera={() => handleImageSource('camera')}
        onGallery={() => handleImageSource('gallery')}
        onClose={() => setShowImageSheet(false)}
      />
    </SheetModal>
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
  kav: {flex: 1, justifyContent: 'flex-end'},
  sheet: {
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
  pad: {paddingHorizontal: 17, paddingBottom: 32},
  title: {fontSize: 22, fontWeight: '700', color: '#000', marginTop: 4},
  subtitle: {fontSize: 13, color: '#828282', marginTop: 4, marginBottom: 16},
  label: {fontSize: 13, fontWeight: '600', color: '#333', marginTop: 18, marginBottom: 8},
  textBox: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#dadada',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#000',
  },
  filled: {borderColor: '#e5383b'},
  row: {flexDirection: 'row', gap: 10},
  rowBtn: {flex: 1},
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  recordingBtn: {backgroundColor: '#e5383b', borderStyle: 'solid'},
  actionBtnText: {fontSize: 14, fontWeight: '600', color: '#e5383b'},
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#dadada',
    borderRadius: 12,
    padding: 10,
  },
  audioPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioDuration: {fontSize: 14, color: '#333', fontWeight: '600'},
  removeX: {fontSize: 16, color: '#828282'},
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#dadada',
    borderRadius: 12,
    padding: 10,
  },
  thumb: {width: 52, height: 52, borderRadius: 8},
  pdfThumb: {backgroundColor: '#fdecec', alignItems: 'center', justifyContent: 'center'},
  fileName: {flex: 1, fontSize: 13, color: '#333'},
  submitBtn: {
    marginTop: 24,
    backgroundColor: '#e5383b',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitDisabled: {backgroundColor: '#c4c4c4'},
  submitText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  hint: {textAlign: 'center', fontSize: 12, color: '#828282', marginTop: 10},
});
