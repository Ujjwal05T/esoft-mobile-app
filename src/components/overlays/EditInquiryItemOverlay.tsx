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
  item?: InquiryItemForm;
  onSave?: (item: InquiryItemForm) => void;
}

export default function EditInquiryItemOverlay({
  isOpen,
  onClose,
  item,
  onSave,
}: EditInquiryItemOverlayProps) {
  const [itemName, setItemName] = useState(item?.itemName || '');
  const [brand, setBrand] = useState(item?.preferredBrand || '');
  const [quantity, setQuantity] = useState(item?.quantity || '1');
  const [notes, setNotes] = useState(item?.notes || '');

  const isValid = itemName.trim() !== '';

  const handleSave = () => {
    if (!isValid) return;
    onSave?.({
      id: item?.id,
      itemName,
      preferredBrand: brand,
      quantity,
      notes,
    });
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

        <ScrollView showsVerticalScrollIndicator={false}>
          <FloatingInput
            label="Part Name"
            value={itemName}
            onChange={setItemName}
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

          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />

          {/* Media Upload */}
          <Text style={styles.sectionLabel}>Photos</Text>
          <View style={styles.mediaRow}>
            {[0, 1, 2].map(i => (
              <TouchableOpacity key={i} style={styles.mediaSlot}>
                <Text style={styles.mediaPlus}>+</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid}
          style={[styles.saveBtn, !isValid && styles.disabledBtn]}>
          <Text style={styles.saveText}>Save</Text>
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
    paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  title: {fontSize: 20, fontWeight: '700', color: '#e5383b', marginBottom: 16},
  sectionLabel: {fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8},
  notesInput: {
    borderWidth: 1, borderColor: '#d4d9e3', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#1a1a1a',
    textAlignVertical: 'top', minHeight: 80, marginBottom: 16,
  },
  mediaRow: {flexDirection: 'row', gap: 12, marginBottom: 16},
  mediaSlot: {
    width: 80, height: 80, borderRadius: 8,
    borderWidth: 1, borderColor: '#d4d9e3', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  mediaPlus: {fontSize: 24, color: '#9ca3af'},
  saveBtn: {
    height: 52, borderRadius: 8,
    backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  disabledBtn: {backgroundColor: '#d1d5db'},
  saveText: {fontSize: 16, fontWeight: '600', color: '#ffffff'},
});
