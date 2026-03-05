import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AccordionSection from '../components/ui/AccordionSection';
import FloatingInput from '../components/ui/FloatingInput';
import {
  getStaffProfile,
  updateStaffProfile,
  WorkshopStaffResponse,
} from '../services/api';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';

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

const EditIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SaveIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 21V13H7V21"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 3V8H15"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface EditableProfile {
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
}

export default function StaffProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<WorkshopStaffResponse | null>(null);
  const [editableProfile, setEditableProfile] = useState<EditableProfile>({
    name: '',
    phoneNumber: '',
    email: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const response = await getStaffProfile();
    if (response.success && response.data) {
      setProfile(response.data);
      setEditableProfile({
        name: response.data.name,
        phoneNumber: response.data.phoneNumber,
        email: response.data.email || '',
        address: response.data.address || '',
      });
    } else {
      setAppAlert({type: 'error', message: response.error || 'Failed to load profile'});
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const response = await updateStaffProfile({
      name: editableProfile.name,
      phoneNumber: editableProfile.phoneNumber,
      email: editableProfile.email || undefined,
      address: editableProfile.address || undefined,
    });
    setSaving(false);
    if (response.success && response.data) {
      setProfile(response.data);
      setEditableProfile({
        name: response.data.name,
        phoneNumber: response.data.phoneNumber,
        email: response.data.email || '',
        address: response.data.address || '',
      });
      setAppAlert({type: 'success', message: 'Profile updated successfully'});
      setIsEditing(false);
    } else {
      setAppAlert({type: 'error', message: response.error || 'Failed to update profile'});
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  const updateField = (field: keyof EditableProfile, value: string) => {
    setEditableProfile(prev => ({...prev, [field]: value}));
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

  const handleSupport = () => {
    console.log('Support clicked');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e5383b" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity onPress={fetchProfile} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <TouchableOpacity
          onPress={handleEditToggle}
          style={styles.iconBtn}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#e5383b" />
          ) : isEditing ? (
            <SaveIcon />
          ) : (
            <EditIcon />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarBox}>
            {profile.photoUrl ? (
              <Image
                source={{uri: profile.photoUrl}}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {getInitials(profile.name)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          {profile.role ? (
            <Text style={styles.profileRole}>{profile.role}</Text>
          ) : null}
        </View>

        {/* Accordion Sections */}
        <View style={styles.accordionsContainer}>
          {/* Personal Information */}
          <AccordionSection
            title="Personal information"
            isOpen={personalOpen}
            onToggle={() => setPersonalOpen(!personalOpen)}>
            <View style={styles.accordionContent}>
              <FloatingInput
                label="Name"
                value={editableProfile.name}
                onChange={v => updateField('name', v)}
                required
                editable={isEditing}
              />
              <FloatingInput
                label="Phone Number"
                value={editableProfile.phoneNumber}
                onChange={v => updateField('phoneNumber', v)}
                required
                editable={isEditing}
                keyboardType="phone-pad"
              />
              <FloatingInput
                label="Email"
                value={editableProfile.email}
                onChange={v => updateField('email', v)}
                editable={isEditing}
                keyboardType="email-address"
              />
              <FloatingInput
                label="Address"
                value={editableProfile.address}
                onChange={v => updateField('address', v)}
                multiline
                editable={isEditing}
              />
            </View>
          </AccordionSection>

          {/* Support Button */}
          <TouchableOpacity
            onPress={handleSupport}
            style={styles.supportBtn}
            activeOpacity={0.8}>
            <Text style={styles.supportBtnText}>SUPPORT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AppAlert
        isOpen={!!appAlert}
        type={appAlert?.type ?? 'info'}
        title={appAlert?.title}
        message={appAlert?.message ?? ''}
        onClose={() => {
          const done = appAlert?.onDone;
          setAppAlert(null);
          done?.();
        }}
        onConfirm={appAlert?.onConfirm ? () => {
          const confirm = appAlert.onConfirm!;
          setAppAlert(null);
          confirm();
        } : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {fontSize: 16, color: '#666'},
  errorText: {fontSize: 16, color: '#e5383b'},
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#e5383b',
    borderRadius: 8,
    marginTop: 8,
  },
  retryBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: 16},
  iconBtn: {padding: 4},
  headerTitle: {fontSize: 20, fontWeight: '600', color: '#e5383b'},
  scrollView: {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 32},
  avatarSection: {alignItems: 'center', paddingVertical: 32},
  avatarBox: {
    width: 108,
    height: 108,
    borderRadius: 54,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  avatar: {width: '100%', height: '100%'},
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  avatarInitials: {fontSize: 32, fontWeight: '600', color: '#828282'},
  profileName: {fontSize: 16, fontWeight: '500', color: '#000'},
  profileRole: {fontSize: 14, color: '#666', marginTop: 2},
  accordionsContainer: {gap: 16},
  accordionContent: {gap: 6, paddingTop: 16},
  supportBtn: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  supportBtnText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#e5383b',
    letterSpacing: 0.5,
  },
});
