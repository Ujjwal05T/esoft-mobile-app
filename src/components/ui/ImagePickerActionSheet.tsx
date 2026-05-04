import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';

interface ImagePickerActionSheetProps {
  visible: boolean;
  title?: string;
  onCamera: () => void;
  onGallery: () => void;
  onClose: () => void;
}

export default function ImagePickerActionSheet({
  visible,
  title = 'Add Photo',
  onCamera,
  onGallery,
  onClose,
}: ImagePickerActionSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.actionSheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.btn} onPress={onCamera} activeOpacity={0.7}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
              stroke="#e5383b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
              stroke="#e5383b"
              strokeWidth="2"
            />
          </Svg>
          <Text style={styles.btnText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onGallery} activeOpacity={0.7}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="3" width="18" height="18" rx="2" stroke="#e5383b" strokeWidth="2" />
            <Path
              d="M3 9l4-4 4 4 4-4 4 4"
              stroke="#e5383b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M3 15l5 5 8-8 5 5"
              stroke="#e5383b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.btnText}>Choose from Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.cancelBtn]}
          onPress={onClose}
          activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
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
  actionSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  handle: {
    width: 172,
    height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  btnText: {fontSize: 15, color: '#000'},
  cancelBtn: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 15,
    color: '#828282',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
});
