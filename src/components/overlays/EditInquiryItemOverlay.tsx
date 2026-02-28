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
  Alert,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Svg, {Path} from 'react-native-svg';
import FloatingInput from '../ui/FloatingInput';
import type {InquiryItemResponse} from '../../services/api';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

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

// ── Icons ─────────────────────────────────────────────────────────────────────

const MicIcon = ({color = '#e5383b'}: {color?: string}) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15C13.66 15 15 13.66 15 12V6C15 4.34 13.66 3 12 3C10.34 3 9 4.34 9 6V12C9 13.66 10.34 15 12 15Z"
      fill={color}
    />
    <Path
      d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V21H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
      fill={color}
    />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke="#828282"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const CloseIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <Path
      d="M9 3L3 9M3 3L9 9"
      stroke="white"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

export default function EditInquiryItemOverlay({
  isOpen,
  onClose,
  item,
  onSave,
}: EditInquiryItemOverlayProps) {
  const [partName, setPartName] = useState(item?.partName || '');
  const [brand, setBrand] = useState(item?.preferredBrand || '');
  const [quantity, setQuantity] = useState(item?.quantity.toString() || '1');
  const [remark, setRemark] = useState(item?.remark || '');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioPath, setAudioPath] = useState<string | null>(item?.audioUrl || null);
  const [audioDuration, setAudioDuration] = useState<number>(item?.audioDuration || 0);
  const audioRecorderPlayerRef = useRef<typeof AudioRecorderPlayer | null>(null);

  // Lazy initialize AudioRecorderPlayer
  if (!audioRecorderPlayerRef.current) {
    audioRecorderPlayerRef.current = AudioRecorderPlayer;
  }
  const audioRecorderPlayer = audioRecorderPlayerRef.current;

  // Image state
  const [images, setImages] = useState<string[]>(
    [item?.image1Url, item?.image2Url, item?.image3Url].filter(Boolean) as string[],
  );

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setPartName(item.partName);
      setBrand(item.preferredBrand);
      setQuantity(item.quantity.toString());
      setRemark(item.remark || '');
      setAudioPath(item.audioUrl || null);
      setAudioDuration(item.audioDuration || 0);
      setImages(
        [item.image1Url, item.image2Url, item.image3Url].filter(Boolean) as string[],
      );
    }
  }, [item]);

  const startRecording = async () => {
    try {
      // Request permission on Android
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
          Alert.alert('Permission Denied', 'Audio recording permission is required to record audio.');
          return;
        }
      }

      const result = await audioRecorderPlayer?.startRecorder();
      setAudioPath(result || null);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Could not start recording. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer?.stopRecorder();
      audioRecorderPlayer?.removeRecordBackListener();
      setIsRecording(false);
      setAudioPath(result || null);
      setAudioDuration(Math.floor(Math.random() * 60) + 10);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const deleteAudio = () => {
    setAudioPath(null);
    setAudioDuration(0);
  };

  const handleImageUpload = () => {
    if (images.length >= 3) {
      Alert.alert('Maximum Images', 'You can only upload up to 3 images.');
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 3 - images.length,
        quality: 0.8,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to select images');
          return;
        }
        if (response.assets) {
          const newImages = response.assets.map(asset => asset.uri || '').filter(Boolean);
          setImages([...images, ...newImages]);
        }
      },
    );
  };

  const deleteImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const isValid = partName.trim() !== '';

  const handleSave = () => {
    if (!isValid) return;

    const updatedItem: Partial<InquiryItemResponse> = {
      partName,
      preferredBrand: brand,
      quantity: parseInt(quantity) || 1,
      remark,
      audioUrl: audioPath,
      audioDuration: audioDuration,
      image1Url: images[0] || null,
      image2Url: images[1] || null,
      image3Url: images[2] || null,
    };

    onSave?.(updatedItem);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>
          {item?.id ? 'Edit Part' : 'Add Part'}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <FloatingInput
            label="Part Name"
            value={partName}
            onChange={setPartName}
            required
          />
          <FloatingInput
            label="Preferred Brand"
            value={brand}
            onChange={setBrand}
          />
          <FloatingInput
            label="Quantity"
            value={quantity}
            onChange={setQuantity}
            keyboardType="numeric"
          />

          <Text style={styles.sectionLabel}>Remark</Text>
          <TextInput
            value={remark}
            onChangeText={setRemark}
            placeholder="Additional remarks..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />

          {/* Media Upload */}
          <Text style={styles.sectionLabel}>Media</Text>
          <View style={styles.mediaRow}>
            {/* Audio Recording Card */}
            {audioPath && (
              <View style={styles.audioCard}>
                <TouchableOpacity style={styles.deleteButton} onPress={deleteAudio}>
                  <CloseIcon />
                </TouchableOpacity>
                <MicIcon />
                <Text style={styles.audioDuration}>{audioDuration}s</Text>
              </View>
            )}

            {/* Uploaded Images */}
            {images.map((image, index) => (
              <View key={index} style={styles.imageCard}>
                <Image source={{uri: image}} style={styles.imageCardImage} />
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteImage(index)}>
                  <CloseIcon />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Button */}
            {(!audioPath || images.length < 3) && (
              <TouchableOpacity
                style={[styles.mediaSlot, isRecording && styles.mediaSlotRecording]}
                onPress={() => {
                  if (!audioPath) {
                    if (isRecording) {
                      stopRecording();
                    } else {
                      startRecording();
                    }
                  } else if (images.length < 3) {
                    handleImageUpload();
                  }
                }}>
                {!audioPath ? (
                  <>
                    <View style={[styles.audioCircle, isRecording && styles.audioCircleRecording]} />
                    <Text style={styles.mediaText}>{isRecording ? 'Stop' : 'Audio'}</Text>
                  </>
                ) : (
                  <>
                    <PlusIcon />
                    <Text style={styles.mediaText}>{3 - images.length} more</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid}
          style={[styles.saveBtn, !isValid && styles.disabledBtn]}>
          <Text style={styles.saveText}>SAVE CHANGES</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingBottom: 2, paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  title: {fontSize: 20, fontWeight: '700', color: '#e5383b', marginBottom: 16},
  scrollView: {marginBottom: 70},
  sectionLabel: {fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8, marginTop: 8},
  notesInput: {
    borderWidth: 1, borderColor: '#d4d9e3', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#1a1a1a',
    textAlignVertical: 'top', minHeight: 80, marginBottom: 16,
  },
  mediaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16},
  mediaSlot: {
    width: (SCREEN_WIDTH - 32 - 36) / 4, aspectRatio: 1, borderRadius: 12,
    borderWidth: 2, borderColor: '#d4d9e3', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff',
  },
  mediaSlotRecording: {borderColor: '#e5383b', backgroundColor: '#fff5f5'},
  mediaPlus: {fontSize: 24, color: '#9ca3af'},
  mediaText: {fontSize: 10, color: '#828282', marginTop: 4},
  audioCard: {
    width: (SCREEN_WIDTH - 32 - 36) / 4, aspectRatio: 1, borderRadius: 12,
    borderWidth: 1, borderColor: '#e5383b', backgroundColor: '#ffffff',
    padding: 8, justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  imageCard: {
    width: (SCREEN_WIDTH - 32 - 36) / 4, aspectRatio: 1, borderRadius: 12,
    borderWidth: 1, borderColor: '#d3d3d3', overflow: 'hidden', position: 'relative',
  },
  imageCardImage: {width: '100%', height: '100%', resizeMode: 'cover'},
  deleteButton: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20,
    backgroundColor: '#e5383b', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  audioDuration: {fontSize: 10, color: '#828282', marginTop: 4},
  audioCircle: {width: 24, height: 24, borderRadius: 12, backgroundColor: '#d3d3d3', marginBottom: 4},
  audioCircleRecording: {backgroundColor: '#e5383b'},
  saveBtn: {
    height: 52, borderRadius: 8,
    backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  disabledBtn: {backgroundColor: '#d1d5db'},
  saveText: {fontSize: 16, fontWeight: '600', color: '#ffffff'},
});
