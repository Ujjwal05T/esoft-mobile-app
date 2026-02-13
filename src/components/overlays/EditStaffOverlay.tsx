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

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatar: string;
  address?: string;
  isActive?: boolean;
}

interface EditStaffOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  onSave?: (staff: StaffMember) => void;
  onDelete?: (id: string) => void;
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

export default function EditStaffOverlay({
  isOpen,
  onClose,
  staff,
  onSave,
  onDelete,
}: EditStaffOverlayProps) {
  const [view, setView] = useState<ViewType>('form');
  const [name, setName] = useState(staff?.name || '');
  const [role, setRole] = useState(staff?.role || '');
  const [phone, setPhone] = useState(staff?.phone || '');
  const [address, setAddress] = useState(staff?.address || '');
  const [isActive, setIsActive] = useState(staff?.isActive ?? true);
  const [permissions, setPermissions] = useState(
    Object.fromEntries(permissionsList.map(p => [p, false])),
  );

  const togglePermission = (perm: string) =>
    setPermissions(prev => ({...prev, [perm]: !prev[perm]}));

  const handleSave = () => {
    if (!staff) return;
    onSave?.({...staff, name, role, phone, address, isActive});
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          {view === 'permissions' && (
            <TouchableOpacity onPress={() => setView('form')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>
            {view === 'form' ? 'Edit Staff' : 'Permissions'}
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {view === 'form' && (
            <>
              <TouchableOpacity style={styles.photoUpload}>
                <Text style={styles.photoPlaceholder}>📷</Text>
                <Text style={styles.photoLabel}>Change Photo</Text>
              </TouchableOpacity>

              <FloatingInput label="Full Name" value={name} onChange={setName} required />
              <FloatingInput label="Role" value={role} onChange={setRole} />
              <FloatingInput label="Phone" value={phone} onChange={setPhone} keyboardType="phone-pad" maxLength={10} />
              <FloatingInput label="Address" value={address} onChange={setAddress} />

              <View style={styles.activeRow}>
                <Text style={styles.activeLabel}>Active</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{false: '#d1d5db', true: '#e5383b'}}
                  thumbColor="#ffffff"
                />
              </View>

              <TouchableOpacity onPress={() => setView('permissions')} style={styles.permissionsBtn}>
                <Text style={styles.permissionsBtnText}>Manage Permissions →</Text>
              </TouchableOpacity>

              {!isActive && staff && (
                <TouchableOpacity
                  onPress={() => {
                    onDelete?.(staff.id);
                    onClose();
                  }}
                  style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Delete Staff Member</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {view === 'permissions' && (
            <View style={styles.permsList}>
              {permissionsList.map(perm => (
                <View key={perm} style={styles.permRow}>
                  <Text style={styles.permLabel}>{perm}</Text>
                  <Switch
                    value={permissions[perm]}
                    onValueChange={() => togglePermission(perm)}
                    trackColor={{false: '#d1d5db', true: '#e5383b'}}
                    thumbColor="#ffffff"
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveText}>Save Changes</Text>
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
  header: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16},
  backBtn: {padding: 4},
  backText: {fontSize: 14, color: '#e5383b', fontWeight: '500'},
  title: {fontSize: 20, fontWeight: '700', color: '#1a1a1a'},
  content: {flex: 1},
  photoUpload: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#d4d9e3', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16,
  },
  photoPlaceholder: {fontSize: 28},
  photoLabel: {fontSize: 11, color: '#666666'},
  activeRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 8},
  activeLabel: {fontSize: 16, color: '#1a1a1a'},
  permissionsBtn: {marginVertical: 8, padding: 12, borderWidth: 1, borderColor: '#e5383b', borderRadius: 8, alignItems: 'center'},
  permissionsBtnText: {fontSize: 14, fontWeight: '500', color: '#e5383b'},
  deleteBtn: {marginTop: 8, padding: 12, borderWidth: 1, borderColor: '#e5383b', borderRadius: 8, alignItems: 'center', backgroundColor: '#fef2f2'},
  deleteText: {fontSize: 14, fontWeight: '500', color: '#e5383b'},
  permsList: {gap: 8},
  permRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  permLabel: {fontSize: 16, color: '#1a1a1a'},
  buttons: {flexDirection: 'row', gap: 12, marginTop: 16},
  cancelBtn: {flex: 1, height: 52, borderRadius: 8, borderWidth: 1, borderColor: '#d4d9e3', alignItems: 'center', justifyContent: 'center'},
  cancelText: {fontSize: 14, fontWeight: '600', color: '#666666'},
  saveBtn: {flex: 1, height: 52, borderRadius: 8, backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center'},
  saveText: {fontSize: 14, fontWeight: '600', color: '#ffffff'},
});
