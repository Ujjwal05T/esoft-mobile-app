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

interface NewJobCardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (job: JobForm) => void;
  staffList?: {id: string; name: string}[];
}

interface JobForm {
  jobCategory: string;
  assignedStaffId: string;
  remark: string;
}

const jobCategories = [
  'Engine Repair', 'Oil Change', 'Brake Service',
  'Tyre Change', 'AC Service', 'Body Work',
  'Electrical', 'Suspension', 'Transmission',
];

export default function NewJobCardOverlay({
  isOpen,
  onClose,
  onSubmit,
  staffList = [],
}: NewJobCardOverlayProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [remark, setRemark] = useState('');

  const isValid = selectedCategory !== '';

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit?.({
      jobCategory: selectedCategory,
      assignedStaffId: selectedStaffId,
      remark,
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
        <Text style={styles.title}>New Job Card</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Job Category Grid */}
          <Text style={styles.sectionLabel}>Job Category *</Text>
          <View style={styles.categoryGrid}>
            {jobCategories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryBtn,
                  selectedCategory === cat && styles.categoryBtnActive,
                ]}>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Assign Staff */}
          {staffList.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Assign To</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffScroll}>
                <View style={styles.staffRow}>
                  {staffList.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSelectedStaffId(s.id)}
                      style={[
                        styles.staffBtn,
                        selectedStaffId === s.id && styles.staffBtnActive,
                      ]}>
                      <Text style={[
                        styles.staffBtnText,
                        selectedStaffId === s.id && styles.staffBtnTextActive,
                      ]}>
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Remark */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Remark</Text>
            <TextInput
              value={remark}
              onChangeText={setRemark}
              placeholder="Add a remark..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              style={styles.remarkInput}
            />
          </View>

          {/* Media placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Media (Photos/Videos)</Text>
            <TouchableOpacity style={styles.mediaUpload}>
              <Text style={styles.mediaIcon}>📎</Text>
              <Text style={styles.mediaLabel}>Add Photos or Videos</Text>
            </TouchableOpacity>
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
            <Text style={styles.submitText}>Add Job</Text>
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
  section: {marginBottom: 16},
  sectionLabel: {fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8},
  categoryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16},
  categoryBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#d4d9e3',
    backgroundColor: '#f9fafb',
  },
  categoryBtnActive: {backgroundColor: '#e5383b', borderColor: '#e5383b'},
  categoryText: {fontSize: 13, color: '#374151'},
  categoryTextActive: {color: '#ffffff', fontWeight: '600'},
  staffScroll: {marginBottom: 8},
  staffRow: {flexDirection: 'row', gap: 8},
  staffBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#d4d9e3',
  },
  staffBtnActive: {backgroundColor: '#e5383b', borderColor: '#e5383b'},
  staffBtnText: {fontSize: 13, color: '#374151'},
  staffBtnTextActive: {color: '#ffffff'},
  remarkInput: {
    borderWidth: 1, borderColor: '#d4d9e3', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#1a1a1a',
    textAlignVertical: 'top', minHeight: 100,
  },
  mediaUpload: {
    borderWidth: 1, borderColor: '#d4d9e3', borderStyle: 'dashed',
    borderRadius: 8, padding: 20, alignItems: 'center',
  },
  mediaIcon: {fontSize: 32, marginBottom: 8},
  mediaLabel: {fontSize: 14, color: '#666666'},
  buttons: {flexDirection: 'row', gap: 12, marginTop: 16},
  cancelBtn: {flex: 1, height: 52, borderRadius: 8, borderWidth: 1, borderColor: '#d4d9e3', alignItems: 'center', justifyContent: 'center'},
  cancelText: {fontSize: 14, fontWeight: '600', color: '#666666'},
  submitBtn: {flex: 1, height: 52, borderRadius: 8, backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center'},
  disabledBtn: {backgroundColor: '#d1d5db'},
  submitText: {fontSize: 14, fontWeight: '600', color: '#ffffff'},
});
