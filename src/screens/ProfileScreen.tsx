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
import AccordionSection from '../components/ui/AccordionSection';
import FloatingInput from '../components/ui/FloatingInput';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getProfile, updateProfile, UpdateProfileData} from '../services/api';
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

interface ProfileData {
  name: string;
  avatarUrl?: string;
  personalInfo: {
    ownerName: string;
    contactNumber: string;
    email?: string;
  };
  workshopDetails: {
    workshopName: string;
    gstNumber?: string;
    tradeLicense?: string;
    aadhaarNumber: string;
    address: string;
  };
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [workshopDetailsOpen, setWorkshopDetailsOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const response = await getProfile();

    if (response.success && response.data?.data) {
      setProfileData(response.data.data);
    } else {
      setAppAlert({type: 'error', message: response.error || 'Failed to load profile'});
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profileData) return;

    setSaving(true);

    const updateData: UpdateProfileData = {
      ownerName: profileData.personalInfo.ownerName,
      contactNumber: profileData.personalInfo.contactNumber,
      email: profileData.personalInfo.email,
      workshopName: profileData.workshopDetails.workshopName,
      gstNumber: profileData.workshopDetails.gstNumber,
      tradeLicense: profileData.workshopDetails.tradeLicense,
      aadhaarNumber: profileData.workshopDetails.aadhaarNumber,
      address: profileData.workshopDetails.address,
    };

    const response = await updateProfile(updateData);

    setSaving(false);

    if (response.success) {
      setAppAlert({type: 'success', message: 'Profile updated successfully'});
      setIsEditing(false);
      // Refresh profile data
      fetchProfile();
    } else {
      setAppAlert({type: 'error', message: response.error || 'Failed to update profile'});
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // User is done editing, save changes
      handleSave();
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    if (!profileData) return;
    setProfileData(prev => prev ? ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }) : null);
  };

  const updateWorkshopDetails = (field: string, value: string) => {
    if (!profileData) return;
    setProfileData(prev => prev ? ({
      ...prev,
      workshopDetails: {
        ...prev.workshopDetails,
        [field]: value,
      },
    }) : null);
  };

  const handleSupport = () => {
    console.log('Support clicked');
    // TODO: Open support overlay or screen
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
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

  if (!profileData) {
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
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

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarBox}>
            {profileData.avatarUrl ? (
              <Image
                source={{uri: profileData.avatarUrl}}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {getInitials(profileData.name)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{profileData.name}</Text>
        </View>

        {/* Accordion Sections */}
        <View style={styles.accordionsContainer}>
          {/* Personal Information */}
          <AccordionSection
            title="Personal information"
            isOpen={personalInfoOpen}
            onToggle={() => setPersonalInfoOpen(!personalInfoOpen)}>
            <View style={styles.accordionContent}>
              <FloatingInput
                label="Owner Name"
                value={profileData.personalInfo.ownerName}
                onChange={v => updatePersonalInfo('ownerName', v)}
                required
                editable={isEditing}
              />
              <FloatingInput
                label="Contact Number"
                value={profileData.personalInfo.contactNumber}
                onChange={v => updatePersonalInfo('contactNumber', v)}
                required
                editable={isEditing}
                keyboardType="phone-pad"
              />
              <FloatingInput
                label="Email"
                value={profileData.personalInfo.email || ''}
                onChange={v => updatePersonalInfo('email', v)}
                editable={isEditing}
                keyboardType="email-address"
              />
            </View>
          </AccordionSection>

          {/* Workshop Details */}
          <AccordionSection
            title="Workshop details"
            isOpen={workshopDetailsOpen}
            onToggle={() => setWorkshopDetailsOpen(!workshopDetailsOpen)}>
            <View style={styles.accordionContent}>
              <FloatingInput
                label="Workshop Name"
                value={profileData.workshopDetails.workshopName}
                onChange={v => updateWorkshopDetails('workshopName', v)}
                editable={isEditing}
              />
              <FloatingInput
                label="GST Number"
                value={profileData.workshopDetails.gstNumber || ''}
                onChange={v => updateWorkshopDetails('gstNumber', v)}
                editable={isEditing}
              />
              <FloatingInput
                label="Trade License"
                value={profileData.workshopDetails.tradeLicense || ''}
                onChange={v => updateWorkshopDetails('tradeLicense', v)}
                editable={isEditing}
              />
              <FloatingInput
                label="Aadhaar Number"
                value={profileData.workshopDetails.aadhaarNumber}
                onChange={v => updateWorkshopDetails('aadhaarNumber', v)}
                editable={isEditing}
              />
              <FloatingInput
                label="Address"
                value={profileData.workshopDetails.address}
                onChange={v => updateWorkshopDetails('address', v)}
                multiline
                editable={isEditing}
              />
            </View>
          </AccordionSection>

          {/* Support Button */}
          <TouchableOpacity onPress={handleSupport} style={styles.supportBtn} activeOpacity={0.8}>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e5383b',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#e5383b',
    borderRadius: 8,
    marginTop: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e5383b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarBox: {
    width: 108,
    height: 108,
    borderRadius: 54,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '600',
    color: '#828282',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  accordionsContainer: {
    gap: 16,
  },
  accordionContent: {
    gap: 16,
    paddingTop: 16,
  },
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
