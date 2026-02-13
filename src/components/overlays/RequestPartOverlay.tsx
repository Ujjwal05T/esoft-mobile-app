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

interface PartRequest {
  partName: string;
  brand: string;
  quantity: string;
  remark: string;
}

interface RequestPartOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (parts: PartRequest[]) => void;
}

const emptyPart = (): PartRequest => ({partName: '', brand: '', quantity: '1', remark: ''});

export default function RequestPartOverlay({
  isOpen,
  onClose,
  onSubmit,
}: RequestPartOverlayProps) {
  const [parts, setParts] = useState<PartRequest[]>([emptyPart()]);

  const updatePart = (idx: number, field: keyof PartRequest, value: string) => {
    setParts(prev => prev.map((p, i) => i === idx ? {...p, [field]: value} : p));
  };

  const addPart = () => setParts(prev => [...prev, emptyPart()]);

  const removePart = (idx: number) => {
    if (parts.length === 1) return;
    setParts(prev => prev.filter((_, i) => i !== idx));
  };

  const isValid = parts.every(p => p.partName.trim() !== '');

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit?.(parts);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Request Parts</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {parts.map((part, idx) => (
            <View key={idx} style={styles.partBlock}>
              <View style={styles.partHeader}>
                <Text style={styles.partNum}>Part {idx + 1}</Text>
                {parts.length > 1 && (
                  <TouchableOpacity onPress={() => removePart(idx)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <FloatingInput
                label="Part Name"
                value={part.partName}
                onChange={v => updatePart(idx, 'partName', v)}
                required
              />
              <FloatingInput
                label="Preferred Brand"
                value={part.brand}
                onChange={v => updatePart(idx, 'brand', v)}
              />
              <FloatingInput
                label="Quantity"
                value={part.quantity}
                onChange={v => updatePart(idx, 'quantity', v)}
                keyboardType="numeric"
              />
              <TextInput
                value={part.remark}
                onChangeText={v => updatePart(idx, 'remark', v)}
                placeholder="Remark (optional)"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                style={styles.remarkInput}
              />

              {/* Media Upload */}
              <View style={styles.mediaRow}>
                {[0, 1, 2].map(i => (
                  <TouchableOpacity key={i} style={styles.mediaSlot}>
                    <Text style={styles.mediaPlus}>+</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity onPress={addPart} style={styles.addPartBtn}>
            <Text style={styles.addPartText}>+ Add Another Part</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid}
            style={[styles.submitBtn, !isValid && styles.disabledBtn]}>
            <Text style={styles.submitText}>Submit Request</Text>
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
  title: {fontSize: 20, fontWeight: '700', color: '#e5383b', marginBottom: 16},
  partBlock: {
    marginBottom: 16, padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  partHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  partNum: {fontSize: 14, fontWeight: '600', color: '#e5383b'},
  removeText: {fontSize: 12, color: '#e5383b'},
  remarkInput: {
    borderWidth: 1, borderColor: '#d4d9e3', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#1a1a1a',
    textAlignVertical: 'top', minHeight: 80, marginBottom: 12,
  },
  mediaRow: {flexDirection: 'row', gap: 12},
  mediaSlot: {
    width: 80, height: 80, borderRadius: 8,
    borderWidth: 1, borderColor: '#d4d9e3', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  mediaPlus: {fontSize: 24, color: '#9ca3af'},
  addPartBtn: {
    paddingVertical: 12, borderWidth: 1, borderColor: '#e5383b',
    borderRadius: 8, borderStyle: 'dashed', alignItems: 'center', marginBottom: 16,
  },
  addPartText: {fontSize: 14, fontWeight: '500', color: '#e5383b'},
  buttons: {flexDirection: 'row', gap: 12, marginTop: 8},
  cancelBtn: {flex: 1, height: 52, borderRadius: 8, borderWidth: 1, borderColor: '#d4d9e3', alignItems: 'center', justifyContent: 'center'},
  cancelText: {fontSize: 14, fontWeight: '600', color: '#666666'},
  submitBtn: {flex: 1, height: 52, borderRadius: 8, backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center'},
  disabledBtn: {backgroundColor: '#d1d5db'},
  submitText: {fontSize: 14, fontWeight: '600', color: '#ffffff'},
});
