import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';

interface DeleteAccountOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteIcon = () => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Path d="M21 5.98C17.67 5.65 14.32 5.48 10.98 5.48C9 5.48 7.02 5.58 5.04 5.78L3 5.98" stroke="#e5383b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="#e5383b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.85 9.14L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14" stroke="#e5383b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.33 16.5H13.66" stroke="#e5383b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.5 12.5H14.5" stroke="#e5383b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function DeleteAccountOverlay({
  isOpen,
  onClose,
  onConfirm,
}: DeleteAccountOverlayProps) {
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.container}>
        <View style={styles.dialog}>
          <View style={styles.redTopBar} />
          <View style={styles.content}>
            <View style={styles.iconBox}>
              <DeleteIcon />
            </View>
            <Text style={styles.title}>Delete Account</Text>
            <Text style={styles.description}>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onConfirm} style={styles.deleteBtn} activeOpacity={0.8}>
                <Text style={styles.deleteText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
  },
  redTopBar: {
    height: 6,
    backgroundColor: '#e5383b',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconBox: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4d9e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2b2b2b',
  },
  deleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
