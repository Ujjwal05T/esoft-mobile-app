import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  TouchableWithoutFeedback,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {launchImageLibrary} from 'react-native-image-picker';
import AppAlert from './AppAlert';

interface AddStaffOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (staffData: StaffFormData) => Promise<{success: boolean; error?: string}>;
}

export interface StaffFormData {
  name: string;
  role: string;
  jobCategories: string[];
  contactNumber: string;
  email: string;
  address: string;
  photo: string | null;
  photoUri: string | null;
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
    <Path
      d="M15 19L8 12L15 5"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CameraIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronIcon = ({rotated}: {rotated?: boolean}) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    style={{transform: [{rotate: rotated ? '180deg' : '0deg'}]}}>
    <Path
      d="M6 9L12 15L18 9"
      stroke="#E5383B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M12 4L4 12M4 4L12 12"
      stroke="#666"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const jobCategories = [
  {id: 'all', name: 'All Services'},
  {id: 'engine', name: 'Engine'},
  {id: 'brake', name: 'Brake System'},
  {id: 'denting', name: 'Denting/Painting'},
  {id: 'ac', name: 'AC'},
  {id: 'electrical', name: 'Electrical'},
  {id: 'transmission', name: 'Transmission'},
  {id: 'suspension', name: 'Suspension'},
];

const ToggleSwitch = ({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) => (
  <TouchableOpacity
    onPress={() => onChange(!enabled)}
    style={[
      styles.toggleSwitch,
      {backgroundColor: enabled ? '#e5383b' : '#e5e5e5'},
    ]}>
    <View
      style={[
        styles.toggleThumb,
        {transform: [{translateX: enabled ? 26 : 2}]},
      ]}
    />
  </TouchableOpacity>
);

export default function AddStaffOverlay({
  isOpen,
  onClose,
  onSubmit,
}: AddStaffOverlayProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const isFormValid = name.trim() !== '' && role.trim() !== '';

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setRole('');
      setSelectedCategories([]);
      setContactNumber('');
      setEmail('');
      setAddress('');
      setPhoto(null);
      setPhotoUri(null);
      setShowCategoryDropdown(false);
      setShowPermissions(false);
      setLoading(false);
      setError('');
      setPermissions({
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

  const handleCategoryToggle = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategories(prev =>
        prev.includes('all') ? [] : ['all'],
      );
    } else {
      setSelectedCategories(prev => {
        const newCategories = prev.filter(c => c !== 'all');
        return newCategories.includes(categoryId)
          ? newCategories.filter(c => c !== categoryId)
          : [...newCategories, categoryId];
      });
    }
  };

  const removeCategory = (categoryId: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== categoryId));
  };

  const handleSubmit = async () => {
    if (!isFormValid || loading) return;
    setError('');
    setLoading(true);
    const result = await onSubmit?.({
      name,
      role,
      jobCategories: selectedCategories,
      contactNumber,
      email,
      address,
      photo,
      photoUri,
      permissions,
    });
    setLoading(false);
    if (result?.success === false) {
      setError(result.error || 'Failed to add staff. Please try again.');
    }
  };

  const updatePermission = (key: keyof StaffPermissions, value: boolean) => {
    setPermissions(prev => ({...prev, [key]: value}));
  };

  if (!isOpen) return null;

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
          <Text style={styles.title}>Add Staff</Text>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.photoContainer}>
            <TouchableOpacity onPress={handlePhotoUpload} style={styles.photoTouchable} activeOpacity={0.8}>
              {photo ? (
                <Image source={{uri: photo}} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <CameraIcon />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePhotoUpload} style={styles.cameraBtn} activeOpacity={0.8}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
          </View>
          <View style={styles.formFields}>
            <View style={styles.inputWrapper}>
              {name !== '' && <Text style={styles.floatingLabel}>Name</Text>}
              <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="#828282" style={[styles.input, name && styles.inputFilled]} />
            </View>
            <View style={styles.inputWrapper}>
              {role !== '' && <Text style={styles.floatingLabel}>Role</Text>}
              <TextInput value={role} onChangeText={setRole} placeholder="Role" placeholderTextColor="#828282" style={[styles.input, role && styles.inputFilled]} />
            </View>
            <View style={styles.inputWrapper}>
              {selectedCategories.length > 0 && <Text style={styles.floatingLabel}>Job Category</Text>}
              <TouchableOpacity onPress={() => setShowCategoryDropdown(!showCategoryDropdown)} style={[styles.dropdownBtn, selectedCategories.length > 0 && styles.inputFilled]}>
                <View style={styles.tagsContainer}>
                  {selectedCategories.length > 0 ? (
                    selectedCategories.map(catId => {
                      const category = jobCategories.find(c => c.id === catId);
                      return (
                        <View key={catId} style={styles.tag}>
                          <Text style={styles.tagText}>{category?.name}</Text>
                          <TouchableOpacity onPress={() => removeCategory(catId)}>
                            <CloseIcon />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.placeholder}>Job Category</Text>
                  )}
                </View>
                <ChevronIcon rotated={showCategoryDropdown} />
              </TouchableOpacity>
              {showCategoryDropdown && (
                <View style={styles.categoryGrid}>
                  {jobCategories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => handleCategoryToggle(category.id)}
                      style={[styles.categoryItem, selectedCategories.includes(category.id) && styles.categoryItemSelected]}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.inputWrapper}>
              {contactNumber !== '' && <Text style={styles.floatingLabel}>Contact Number</Text>}
              <TextInput value={contactNumber} maxLength={10} onChangeText={setContactNumber} placeholder="Contact Number" placeholderTextColor="#828282" keyboardType="phone-pad" style={[styles.input, contactNumber && styles.inputFilled]} />
            </View>
            <View style={styles.inputWrapper}>
              {email !== '' && <Text style={styles.floatingLabel}>Email</Text>}
              <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#828282" keyboardType="email-address" autoCapitalize="none" style={[styles.input, email && styles.inputFilled]} />
            </View>
            <View style={styles.inputWrapper}>
              {address !== '' && <Text style={styles.floatingLabel}>Address</Text>}
              <TextInput value={address} onChangeText={setAddress} placeholder="Address" placeholderTextColor="#828282" style={[styles.input, address && styles.inputFilled]} />
            </View>
          </View>
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <View style={styles.buttons}>
            <TouchableOpacity onPress={handleSubmit} disabled={!isFormValid || loading} style={[styles.submitBtn, (!isFormValid || loading) && styles.submitBtnDisabled]} activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>ADD STAFF</Text>
              )}
            </TouchableOpacity>
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
  photoPlaceholder: {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
  cameraBtn: {position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4},
  formFields: {gap: 16},
  inputWrapper: {position: 'relative'},
  floatingLabel: {position: 'absolute', top: -8, left: 12, backgroundColor: '#fff', paddingHorizontal: 4, fontSize: 10, color: '#828282', zIndex: 10},
  input: {borderWidth: 1, borderColor: '#d3d3d3', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#000'},
  inputFilled: {borderColor: '#e5383b'},
  placeholder: {fontSize: 15, color: '#828282'},
  dropdownBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#d3d3d3', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14},
  tagsContainer: {flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  tag: {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f5f5f5', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4},
  tagText: {fontSize: 13, color: '#000'},
  categoryGrid: {marginTop: 8, borderWidth: 1, borderColor: '#d3d3d3', borderRadius: 8, padding: 12, backgroundColor: '#fff', flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  categoryItem: {width: '31%', padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center'},
  categoryItemSelected: {backgroundColor: '#fff5f5', borderWidth: 2, borderColor: '#e5383b'},
  categoryName: {fontSize: 11, fontWeight: '500', color: '#333', textAlign: 'center'},
  errorBox: {marginTop: 16, padding: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8},
  errorText: {fontSize: 14, color: '#dc2626'},
  buttons: {marginTop: 12, gap: 12},
  submitBtn: {height: 56, backgroundColor: '#e5383b', borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  submitBtnDisabled: {backgroundColor: '#d3d3d3'},
  submitBtnText: {fontSize: 15, fontWeight: '500', color: '#fff', letterSpacing: 0.5},
  permissionsLinkBtn: {paddingVertical: 12, alignItems: 'center'},
  permissionsLinkText: {fontSize: 15, fontWeight: '500', color: '#e5383b'},
  permissionsList: {gap: 24, paddingBottom: 40},
  permissionRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  permissionLabel: {fontSize: 16, color: '#333'},
  permissionActive: {color: '#e5383b', fontWeight: '500'},
  toggleSwitch: {width: 52, height: 28, borderRadius: 14, justifyContent: 'center'},
  toggleThumb: {position: 'absolute', top: 2, width: 24, height: 24, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2},
});
