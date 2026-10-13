import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import SheetModal from '../ui/SheetModal';
import {useTranslation} from 'react-i18next';
import AppAlert, {AlertState} from './AppAlert';
import {updateBulkRequestText} from '../../services/api';

interface EditBulkRequestOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  inquiryId: number;
  initialText: string;
  onSuccess: () => void;
}

export default function EditBulkRequestOverlay({
  isOpen,
  onClose,
  inquiryId,
  initialText,
  onSuccess,
}: EditBulkRequestOverlayProps) {
  const {t} = useTranslation();
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  useEffect(() => {
    if (isOpen) setText(initialText);
  }, [isOpen, initialText]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateBulkRequestText(inquiryId, text);
      if (result.success) {
        onClose();
        onSuccess();
      } else {
        setAppAlert({type: 'error', message: result.error || t('bulk_request.update_failed')});
      }
    } finally {
      setSaving(false);
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
          <View style={styles.pad}>
            <Text style={styles.title}>{t('bulk_request.edit_title')}</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('bulk_request.text_placeholder')}
              placeholderTextColor="#828282"
              multiline
              textAlignVertical="top"
              maxLength={4000}
              autoFocus
              style={styles.textBox}
            />
            <View style={styles.buttons}>
              <TouchableOpacity
                onPress={onClose}
                disabled={saving}
                style={[styles.btn, styles.cancelBtn]}
                activeOpacity={0.8}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={[styles.btn, styles.saveBtn, saving && styles.disabled]}
                activeOpacity={0.85}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t('common.save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <AppAlert
        isOpen={!!appAlert}
        type={appAlert?.type ?? 'info'}
        title={appAlert?.title}
        message={appAlert?.message ?? ''}
        onClose={() => setAppAlert(null)}
      />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)'},
  kav: {flex: 1, justifyContent: 'flex-end'},
  sheet: {backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24},
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#dadada',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  pad: {paddingHorizontal: 17, paddingBottom: 28},
  title: {fontSize: 20, fontWeight: '700', color: '#000', marginVertical: 8},
  textBox: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#000',
  },
  buttons: {flexDirection: 'row', gap: 10, marginTop: 16},
  btn: {flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center'},
  cancelBtn: {borderWidth: 1, borderColor: '#dadada'},
  cancelText: {fontSize: 15, fontWeight: '600', color: '#333'},
  saveBtn: {backgroundColor: '#e5383b'},
  saveText: {fontSize: 15, fontWeight: '700', color: '#fff'},
  disabled: {opacity: 0.7},
});
