import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {useTranslation} from 'react-i18next';

const UpdateIcon = () => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={11} stroke="#e5383b" strokeWidth={1.5} />
    <Path
      d="M12 7v6M12 16v1"
      stroke="#e5383b"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

interface AppUpdateModalProps {
  visible: boolean;
  updateType: 'optional' | 'forced';
  latestVersion: string;
  storeUrl: string;
  releaseNotes?: string | null;
  onDismiss: () => void; // only called for optional
}

const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  visible,
  updateType,
  latestVersion,
  storeUrl,
  releaseNotes,
  onDismiss,
}) => {
  const {t} = useTranslation();
  const isForced = updateType === 'forced';

  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl).catch(() => {});
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isForced ? undefined : onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <UpdateIcon />
          </View>

          <Text style={styles.title}>
            {isForced ? t('update.required') : t('update.available')}
          </Text>

          <Text style={styles.version}>{t('update.version')} {latestVersion}</Text>

          <Text style={styles.body}>
            {isForced ? t('update.body_forced') : t('update.body_optional')}
          </Text>

          {!!releaseNotes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>{t('update.whats_new')}</Text>
              <Text style={styles.notesText}>{releaseNotes}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} activeOpacity={0.85}>
            <Text style={styles.updateBtnText}>{t('update.now')}</Text>
          </TouchableOpacity>

          {!isForced && (
            <TouchableOpacity style={styles.laterBtn} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={styles.laterBtnText}>{t('update.later')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  version: {
    fontSize: 13,
    color: '#e5383b',
    fontWeight: '600',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  notesBox: {
    width: '100%',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e5383b',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 19,
  },
  updateBtn: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#e5383b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  updateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  laterBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4d9e3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
});

export default AppUpdateModal;
