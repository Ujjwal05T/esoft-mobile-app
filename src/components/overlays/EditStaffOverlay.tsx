import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput,
  Image,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {launchImageLibrary} from 'react-native-image-picker';

interface EditStaffOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (staffData: EditStaffFormData) => void;
  onToggleActive?: (staffId: string, isActive: boolean) => void;
  onDelete?: (staffId: string) => void;
  staffData: EditStaffFormData | null;
}

export interface EditStaffFormData {
  id: string;
  name: string;
  contactNumber: string;
  address: string;
  role: string;
  photo: string | null;
  photoUri?: string | null;
  isActive: boolean;
  permissions: StaffPermissions;
}

export interface StaffPermissions {
  vehicleApprovals: boolean;
  inquiryApprovals: boolean;
  generateEstimates: boolean;
  createJobCard: boolean;
  disputeApprovals: boolean;
  quoteApprovalsPayments: boolean;
  addVehicle: boolean;
  raiseDispute: boolean;
  createInquiry: boolean;
}

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19L8 12L15 5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CameraIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TrashIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6H5H21" stroke="#e5383b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#e5383b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ToggleSwitch = ({enabled, onChange}: {enabled: boolean; onChange: (value: boolean) => void}) => (
  <TouchableOpacity onPress={() => onChange(!enabled)} style={[styles.toggleSwitch, {backgroundColor: enabled ? '#e5383b' : '#e5e5e5'}]}>
    <View style={[styles.toggleThumb, {transform: [{translateX: enabled ? 26 : 2}]}]} />
  </TouchableOpacity>
);

export default function EditStaffOverlay({isOpen, onClose, onUpdate, onToggleActive, onDelete, staffData}: EditStaffOverlayProps) {
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState<StaffPermissions>({
    vehicleApprovals: false,
    inquiryApprovals: false,
    generateEstimates: false,
    createJobCard: false,
    disputeApprovals: false,
    quoteApprovalsPayments: false,
    addVehicle: false,
    raiseDispute: false,
    createInquiry: false,
  });

  const [showPermissions, setShowPermissions] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'inactive' | 'active' | 'delete'>('inactive');

  useEffect(() => {
    if (isOpen && staffData) {
      setName(staffData.name);
      setContactNumber(staffData.contactNumber);
      setAddress(staffData.address);
      setRole(staffData.role);
      setPhoto(staffData.photo);
      setPhotoUri(null);
      setIsActive(staffData.isActive);
      setPermissions(staffData.permissions);
    }
  }, [isOpen, staffData]);

  useEffect(() => {
    if (!isOpen) {
      setShowPermissions(false);
      setShowConfirmDialog(false);
    }
  }, [isOpen]);

  const handlePhotoUpload = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
        selectionLimit: 1,
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
          return;
        }
        if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
          return;
        }
        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          console.log('Image selected:', asset.uri);
          setPhotoUri(asset.uri || null);
          setPhoto(asset.uri || null);
        }
      },
    );
  };

  const hasPermissionsChanged = staffData && (
    permissions.vehicleApprovals !== staffData.permissions.vehicleApprovals ||
    permissions.inquiryApprovals !== staffData.permissions.inquiryApprovals ||
    permissions.generateEstimates !== staffData.permissions.generateEstimates ||
    permissions.createJobCard !== staffData.permissions.createJobCard ||
    permissions.disputeApprovals !== staffData.permissions.disputeApprovals ||
    permissions.quoteApprovalsPayments !== staffData.permissions.quoteApprovalsPayments ||
    permissions.addVehicle !== staffData.permissions.addVehicle ||
    permissions.raiseDispute !== staffData.permissions.raiseDispute ||
    permissions.createInquiry !== staffData.permissions.createInquiry
  );

  const hasChanges = staffData && (
    name !== staffData.name ||
    contactNumber !== staffData.contactNumber ||
    address !== staffData.address ||
    role !== staffData.role ||
    photo !== staffData.photo ||
    hasPermissionsChanged
  );

  const handleUpdate = () => {
    if (!staffData) return;
    onUpdate?.({...staffData, name, contactNumber, address, role, photo, photoUri, isActive, permissions});
    onClose();
  };

  const handleConfirmAction = () => {
    if (!staffData) return;
    if (confirmAction === 'delete') {
      onDelete?.(staffData.id);
    } else {
      onToggleActive?.(staffData.id, confirmAction === 'active');
    }
    setShowConfirmDialog(false);
    onClose();
  };

  const updatePermission = (key: keyof StaffPermissions, value: boolean) => {
    setPermissions(prev => ({...prev, [key]: value}));
  };

  const getInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!isOpen || !staffData) return null;

  if (showConfirmDialog) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setShowConfirmDialog(false)}>
        <TouchableWithoutFeedback onPress={() => setShowConfirmDialog(false)}>
          <View style={styles.confirmBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.confirmDialog}>
          <View style={styles.confirmIconContainer}>
            <TrashIcon />
          </View>
          <Text style={styles.confirmTitle}>
            {confirmAction === 'delete' ? 'DELETE STAFF' : confirmAction === 'inactive' ? 'MARK AS INACTIVE' : 'MARK AS ACTIVE'}
          </Text>
          <Text style={styles.confirmMessage}>
            {confirmAction === 'delete'
              ? `Are you sure you want to delete ${name}?`
              : `Are you sure you want to mark ${name} ${confirmAction === 'inactive' ? 'Inactive' : 'Active'}?`}
          </Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity onPress={() => setShowConfirmDialog(false)} style={styles.confirmCancelBtn}>
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirmAction} style={styles.confirmYesBtn}>
              <Text style={styles.confirmYesText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (showPermissions) {
    return (
      <Modal visible transparent animationType="slide" onRequestClose={() => setShowPermissions(false)}>
        <TouchableWithoutFeedback onPress={() => setShowPermissions(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowPermissions(false)} style={styles.iconBtn}>
              <BackIcon />
            </TouchableOpacity>
            <Text style={styles.title}>Permissions</Text>
          </View>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.permissionsList}>
              {[
                {key: 'vehicleApprovals', label: 'Vehicle Approvals'},
                {key: 'inquiryApprovals', label: 'Inquiry Approvals'},
                {key: 'generateEstimates', label: 'Generate Estimates'},
                {key: 'createJobCard', label: 'Create Job Card'},
                {key: 'disputeApprovals', label: 'Dispute Approvals'},
                {key: 'quoteApprovalsPayments', label: 'Quote Approvals/Payments'},
                {key: 'addVehicle', label: 'Add Vehicle'},
                {key: 'raiseDispute', label: 'Raise Dispute'},
                {key: 'createInquiry', label: 'Create Inquiry'},
              ].map(({key, label}) => (
                <View key={key} style={styles.permissionRow}>
                  <Text style={[styles.permissionLabel, permissions[key as keyof StaffPermissions] && styles.permissionActive]}>
                    {label}
                  </Text>
                  <ToggleSwitch
                    enabled={permissions[key as keyof StaffPermissions]}
                    onChange={value => updatePermission(key as keyof StaffPermissions, value)}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>Staff Details</Text>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.photoContainer}>
            <TouchableOpacity onPress={handlePhotoUpload} style={styles.photoTouchable} activeOpacity={0.8}>
              {photo ? (
                <Image source={{uri: photo}} style={styles.photoImage} />
              ) : (
                <View style={styles.photoFallback}>
                  <Text style={styles.photoInitials}>{getInitials(name)}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePhotoUpload} style={styles.cameraBtn} activeOpacity={0.8}>
              <CameraIcon />
            </TouchableOpacity>
          </View>
          <View style={styles.formFields}>
            <View style={styles.inputWrapper}>
              <Text style={styles.floatingLabel}>Name</Text>
              <TextInput value={name} onChangeText={setName} style={styles.input} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.floatingLabel}>Contact Number</Text>
              <TextInput value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" style={styles.input} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.floatingLabel}>Address</Text>
              <TextInput value={address} onChangeText={setAddress} style={styles.input} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.floatingLabel}>Role</Text>
              <TextInput value={role} onChangeText={setRole} style={styles.input} />
            </View>
          </View>
          <View style={styles.buttons}>
            <TouchableOpacity onPress={handleUpdate} disabled={!hasChanges} style={[styles.updateBtn, !hasChanges && styles.updateBtnDisabled]} activeOpacity={0.8}>
              <Text style={styles.updateBtnText}>UPDATE DETAILS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setConfirmAction(isActive ? 'inactive' : 'active');
                setShowConfirmDialog(true);
              }}
              style={styles.toggleActiveBtn}
              activeOpacity={0.8}>
              <Text style={styles.toggleActiveBtnText}>{isActive ? 'MARK AS INACTIVE' : 'MARK AS ACTIVE'}</Text>
            </TouchableOpacity>
            {!isActive && (
              <TouchableOpacity
                onPress={() => {
                  setConfirmAction('delete');
                  setShowConfirmDialog(true);
                }}
                style={styles.deleteBtn}
                activeOpacity={0.8}>
                <Text style={styles.deleteBtnText}>DELETE STAFF</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowPermissions(true)} style={styles.permissionsLinkBtn} activeOpacity={0.8}>
              <Text style={styles.permissionsLinkText}>MANAGE PERMISSIONS</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)'},
  sheet: {position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '90%', shadowColor: '#e5383b', shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.2, shadowRadius: 19.2, elevation: 10},
  handle: {width: 172, height: 4, backgroundColor: '#d9d9d9', borderRadius: 23, alignSelf: 'center', marginTop: 12, marginBottom: 8},
  header: {flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingBottom: 20},
  iconBtn: {padding: 4},
  title: {fontSize: 24, fontWeight: '600', color: '#000', flex: 1},
  content: {flex: 1, paddingHorizontal: 16, paddingBottom: 24},
  photoContainer: {width: '100%', height: 180, backgroundColor: '#f5f5f5', borderRadius: 12, marginBottom: 24, overflow: 'hidden', position: 'relative'},
  photoTouchable: {width: '100%', height: '100%'},
  photoImage: {width: '100%', height: '100%', resizeMode: 'cover'},
  photoFallback: {width: '100%', height: '100%', backgroundColor: '#e5e5e5', alignItems: 'center', justifyContent: 'center'},
  photoInitials: {fontSize: 48, fontWeight: '600', color: '#999'},
  cameraBtn: {position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4},
  formFields: {gap: 16},
  inputWrapper: {position: 'relative'},
  floatingLabel: {position: 'absolute', top: -8, left: 12, backgroundColor: '#fff', paddingHorizontal: 4, fontSize: 10, color: '#828282', zIndex: 10},
  input: {borderWidth: 1, borderColor: '#d3d3d3', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#000'},
  buttons: {marginTop: 24, gap: 12},
  updateBtn: {height: 56, backgroundColor: '#e5383b', borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  updateBtnDisabled: {backgroundColor: '#d3d3d3'},
  updateBtnText: {fontSize: 15, fontWeight: '500', color: '#fff', letterSpacing: 0.5},
  toggleActiveBtn: {height: 48, borderWidth: 1, borderColor: '#e5383b', borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  toggleActiveBtnText: {fontSize: 15, fontWeight: '500', color: '#e5383b', letterSpacing: 0.5},
  deleteBtn: {height: 48, borderWidth: 1, borderColor: '#e5383b', borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  deleteBtnText: {fontSize: 15, fontWeight: '500', color: '#e5383b', letterSpacing: 0.5},
  permissionsLinkBtn: {paddingVertical: 12, alignItems: 'center'},
  permissionsLinkText: {fontSize: 15, fontWeight: '500', color: '#e5383b'},
  permissionsList: {gap: 24, paddingBottom: 40},
  permissionRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  permissionLabel: {fontSize: 16, color: '#333'},
  permissionActive: {color: '#e5383b', fontWeight: '500'},
  toggleSwitch: {width: 52, height: 28, borderRadius: 14, justifyContent: 'center'},
  toggleThumb: {position: 'absolute', top: 2, width: 24, height: 24, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2},
  confirmBackdrop: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)'},
  confirmDialog: {position: 'absolute', top: '50%', left: 24, right: 24, transform: [{translateY: -150}], backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 2, borderColor: '#e5383b', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10},
  confirmIconContainer: {width: 56, height: 56, backgroundColor: '#fff5f5', borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16},
  confirmTitle: {fontSize: 18, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 8},
  confirmMessage: {fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24},
  confirmButtons: {flexDirection: 'row', gap: 12},
  confirmCancelBtn: {flex: 1, height: 48, borderWidth: 1, borderColor: '#d3d3d3', borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  confirmCancelText: {fontSize: 15, fontWeight: '500', color: '#333'},
  confirmYesBtn: {flex: 1, height: 48, backgroundColor: '#e5383b', borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  confirmYesText: {fontSize: 15, fontWeight: '500', color: '#fff'},
});
