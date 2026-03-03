import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';

const LockIcon = () => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
      ry="2"
      stroke="#e5383b"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke="#e5383b"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 16v2"
      stroke="#e5383b"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface NoPermissionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function NoPermissionOverlay({
  isOpen,
  onClose,
  message = 'You do not have permission to perform this action. Please contact your workshop owner.',
}: NoPermissionOverlayProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.container}>
        <View style={styles.dialog}>
          <View style={styles.redTopBar} />
          <View style={styles.content}>
            <View style={styles.iconBox}>
              <LockIcon />
            </View>
            <Text style={styles.title}>No Permission</Text>
            <Text style={styles.description}>{message}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.okBtn}
              activeOpacity={0.8}>
              <Text style={styles.okText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  okBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  okText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
