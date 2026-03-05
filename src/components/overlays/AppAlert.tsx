import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';

export type AlertType = 'success' | 'error' | 'confirm' | 'warning' | 'info';

export interface AlertState {
  type: AlertType;
  title?: string;
  message: string;
  onConfirm?: () => void;
  onDone?: () => void;
  confirmText?: string;
  cancelText?: string;
  okText?: string;
}

interface AppAlertProps {
  isOpen: boolean;
  type: AlertType;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  okText?: string;
}

const TYPE_CONFIG: Record<AlertType, {color: string; defaultTitle: string}> = {
  success: {color: '#22c55e', defaultTitle: 'Success'},
  error:   {color: '#e5383b', defaultTitle: 'Error'},
  confirm: {color: '#f59e0b', defaultTitle: 'Confirm'},
  warning: {color: '#f97316', defaultTitle: 'Warning'},
  info:    {color: '#3b82f6', defaultTitle: 'Info'},
};

const SuccessIcon = ({color}: {color: string}) => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} />
    <Path
      d="M8 12l3 3 5-5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ErrorIcon = ({color}: {color: string}) => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} />
    <Path
      d="M15 9l-6 6M9 9l6 6"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const ConfirmIcon = ({color}: {color: string}) => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} />
    <Path
      d="M12 8v5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Circle cx="12" cy="16" r="0.75" fill={color} />
  </Svg>
);

const WarningIcon = ({color}: {color: string}) => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 9v5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Circle cx="12" cy="17" r="0.75" fill={color} />
  </Svg>
);

const InfoIcon = ({color}: {color: string}) => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} />
    <Path
      d="M12 16v-5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Circle cx="12" cy="8" r="0.75" fill={color} />
  </Svg>
);

const ICONS: Record<AlertType, React.FC<{color: string}>> = {
  success: SuccessIcon,
  error: ErrorIcon,
  confirm: ConfirmIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

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
  topBar: {
    height: 6,
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
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  okBtn: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  okText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  btnRow: {
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
    color: '#1a1a1a',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default function AppAlert({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  okText = 'Got it',
}: AppAlertProps) {
  const {color, defaultTitle} = TYPE_CONFIG[type];
  const Icon = ICONS[type];
  const isConfirm = type === 'confirm';

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={isConfirm ? undefined : onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.container}>
        <View style={styles.dialog}>
          <View style={[styles.topBar, {backgroundColor: color}]} />
          <View style={styles.content}>
            <View style={styles.iconBox}>
              <Icon color={color} />
            </View>
            <Text style={styles.title}>{title ?? defaultTitle}</Text>
            <Text style={styles.message}>{message}</Text>

            {isConfirm ? (
              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.cancelBtn}
                  activeOpacity={0.8}>
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onConfirm}
                  style={[styles.confirmBtn, {backgroundColor: color}]}
                  activeOpacity={0.8}>
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={onClose}
                style={[styles.okBtn, {backgroundColor: color}]}
                activeOpacity={0.8}>
                <Text style={styles.okText}>{okText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
