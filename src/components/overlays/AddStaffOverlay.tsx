import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  TouchableWithoutFeedback,
} from 'react-native';
import FloatingInput from '../ui/FloatingInput';

interface AddStaffOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (staff: StaffForm) => void;
}

interface StaffForm {
  name: string;
  role: string;
  phone: string;
  address: string;
  permissions: Record<string, boolean>;
}

const permissionsList = [
  'Add Vehicle',
  'Raise Inquiry',
  'Raise Dispute',
  'Gate Out',
  'View Reports',
  'Manage Staff',
];

type ViewType = 'form' | 'permissions';

export default function AddStaffOverlay({
  isOpen,
  onClose,
  onSave,
}: AddStaffOverlayProps) {
  const [view, setView] = useState<ViewType>('form');
  const [form, setForm] = useState<StaffForm>({
    name: '',
    role: '',
    phone: '',
    address: '',
    permissions: Object.fromEntries(permissionsList.map(p => [p, false])),
  });

  const setField = (field: keyof Pick<StaffForm, 'name' | 'role' | 'phone' | 'address'>) =>
    (value: string) => setForm(prev => ({...prev, [field]: value}));

  const togglePermission = (perm: string) =>
    setForm(prev => ({
      ...prev,
      permissions: {...prev.permissions, [perm]: !prev.permissions[perm]},
    }));

  const isValid = form.name.trim() !== '' && form.phone.trim() !== '';

  const handleSave = () => {
    if (!isValid) return;
    onSave?.(form);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          {view === 'permissions' && (
            <TouchableOpacity onPress={() => setView('form')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>
            {view === 'form' ? 'Add Staff' : 'Permissions'}
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {view === 'form' && (
            <>
              {/* Photo placeholder */}
              <TouchableOpacity style={styles.photoUpload}>
                <Text style={styles.photoPlaceholder}>📷</Text>
                <Text style={styles.photoLabel}>Upload Photo</Text>
              </TouchableOpacity>

              <FloatingInput label="Full Name" value={form.name} onChange={setField('name')} required />
              <FloatingInput label="Role" value={form.role} onChange={setField('role')} />
              <FloatingInput label="Phone" value={form.phone} onChange={setField('phone')} keyboardType="phone-pad" maxLength={10} required />
              <FloatingInput label="Address" value={form.address} onChange={setField('address')} />

              <TouchableOpacity
                onPress={() => setView('permissions')}
                style={styles.permissionsBtn}>
                <Text style={styles.permissionsBtnText}>Manage Permissions →</Text>
              </TouchableOpacity>
            </>
          )}

          {view === 'permissions' && (
            <View style={styles.permsList}>
              {permissionsList.map(perm => (
                <View key={perm} style={styles.permRow}>
                  <Text style={styles.permLabel}>{perm}</Text>
                  <Switch
                    value={form.permissions[perm]}
                    onValueChange={() => togglePermission(perm)}
                    trackColor={{false: '#d1d5db', true: '#e5383b'}}
                    thumbColor="#ffffff"
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid}
            style={[styles.saveBtn, !isValid && styles.disabledBtn]}>
            <Text style={styles.saveText}>Add Staff</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#d1d5db',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  backBtn: {padding: 4},
  backText: {fontSize: 14, color: '#e5383b', fontWeight: '500'},
  title: {fontSize: 20, fontWeight: '700', color: '#1a1a1a'},
  content: {flex: 1},
  photoUpload: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f5f5f5',
    borderWidth: 1, borderColor: '#d4d9e3', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  photoPlaceholder: {fontSize: 28},
  photoLabel: {fontSize: 11, color: '#666666', marginTop: 4},
  permissionsBtn: {
    marginVertical: 8, padding: 12,
    borderWidth: 1, borderColor: '#e5383b', borderRadius: 8,
    alignItems: 'center',
  },
  permissionsBtnText: {fontSize: 14, fontWeight: '500', color: '#e5383b'},
  permsList: {gap: 8},
  permRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  permLabel: {fontSize: 16, color: '#1a1a1a'},
  buttons: {flexDirection: 'row', gap: 12, marginTop: 16},
  cancelBtn: {
    flex: 1, height: 52, borderRadius: 8,
    borderWidth: 1, borderColor: '#d4d9e3',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: {fontSize: 14, fontWeight: '600', color: '#666666'},
  saveBtn: {
    flex: 1, height: 52, borderRadius: 8,
    backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center',
  },
  disabledBtn: {backgroundColor: '#d1d5db'},
  saveText: {fontSize: 14, fontWeight: '600', color: '#ffffff'},
});
