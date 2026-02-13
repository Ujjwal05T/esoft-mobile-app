import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import FloatingInput from '../ui/FloatingInput';

interface RaiseDisputeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (dispute: DisputeForm) => void;
  vehicleInfo?: {plateNumber: string; vehicleName: string};
}

interface DisputeForm {
  orderId: string;
  part: string;
  reason: string;
  remark: string;
}

const reasons = [
  'Wrong Part Delivered',
  'Damaged Part',
  'Part Not Delivered',
  'Quality Issue',
  'Price Discrepancy',
  'Other',
];

export default function RaiseDisputeOverlay({
  isOpen,
  onClose,
  onSubmit,
  vehicleInfo,
}: RaiseDisputeOverlayProps) {
  const [orderId, setOrderId] = useState('');
  const [part, setPart] = useState('');
  const [reason, setReason] = useState('');
  const [remark, setRemark] = useState('');

  const isValid = orderId.trim() !== '' && reason !== '';

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit?.({orderId, part, reason, remark});
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Raise Dispute</Text>

        {vehicleInfo && (
          <Text style={styles.vehicleInfo}>
            {vehicleInfo.vehicleName} • {vehicleInfo.plateNumber}
          </Text>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          <FloatingInput
            label="Order ID"
            value={orderId}
            onChange={setOrderId}
            required
          />
          <FloatingInput
            label="Part (Optional)"
            value={part}
            onChange={setPart}
          />

          {/* Reason Selection */}
          <Text style={styles.sectionLabel}>Reason *</Text>
          <View style={styles.reasonsGrid}>
            {reasons.map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => setReason(r)}
                style={[styles.reasonBtn, reason === r && styles.reasonBtnActive]}>
                <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Remark */}
          <Text style={styles.sectionLabel}>Remark</Text>
          <TextInput
            value={remark}
            onChangeText={setRemark}
            placeholder="Describe the issue..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            style={styles.remarkInput}
          />

          {/* Media Upload */}
          <Text style={styles.sectionLabel}>Evidence (Photos)</Text>
          <View style={styles.mediaRow}>
            {[0, 1, 2].map(i => (
              <TouchableOpacity key={i} style={styles.mediaSlot}>
                <Text style={styles.mediaPlus}>+</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid}
            style={[styles.submitBtn, !isValid && styles.disabledBtn]}>
            <Text style={styles.submitText}>Raise Dispute</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  title: {fontSize: 20, fontWeight: '700', color: '#e5383b', marginBottom: 4},
  vehicleInfo: {fontSize: 13, color: '#666666', marginBottom: 16},
  sectionLabel: {fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8},
  reasonsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16},
  reasonBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#d4d9e3',
  },
  reasonBtnActive: {backgroundColor: '#e5383b', borderColor: '#e5383b'},
  reasonText: {fontSize: 13, color: '#374151'},
  reasonTextActive: {color: '#ffffff', fontWeight: '600'},
  remarkInput: {
    borderWidth: 1, borderColor: '#d4d9e3', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#1a1a1a',
    textAlignVertical: 'top', minHeight: 100, marginBottom: 12,
  },
  mediaRow: {flexDirection: 'row', gap: 12, marginBottom: 16},
  mediaSlot: {
    width: 80, height: 80, borderRadius: 8,
    borderWidth: 1, borderColor: '#d4d9e3', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  mediaPlus: {fontSize: 24, color: '#9ca3af'},
  buttons: {flexDirection: 'row', gap: 12, marginTop: 8},
  cancelBtn: {flex: 1, height: 52, borderRadius: 8, borderWidth: 1, borderColor: '#d4d9e3', alignItems: 'center', justifyContent: 'center'},
  cancelText: {fontSize: 14, fontWeight: '600', color: '#666666'},
  submitBtn: {flex: 1, height: 52, borderRadius: 8, backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center'},
  disabledBtn: {backgroundColor: '#d1d5db'},
  submitText: {fontSize: 14, fontWeight: '600', color: '#ffffff'},
});
