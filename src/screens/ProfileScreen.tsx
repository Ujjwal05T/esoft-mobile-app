import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

import Svg, {Path} from 'react-native-svg';
import AccordionSection from '../components/ui/AccordionSection';
import FloatingInput from '../components/ui/FloatingInput';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const mockProfileData = {
  name: 'Shubham Jain',
  avatar: undefined,
  personalInfo: {
    ownerName: 'Shubham Jain',
    contactNumber: '9888001109',
  },
  workshopDetails: {
    workshopName: 'AutoCare Garage',
    gstNumber: '345675678665',
    tradeLicense: '1HFH7988DH',
    aadhaarNumber: '9337-8987-9898',
    address:
      '16-A Basant Vihar Colony, Near Satya Sai Square, Indore (M.P) - 452010, Indore, Madhya Pradesh 452010, India',
  },
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [workshopDetailsOpen, setWorkshopDetailsOpen] = useState(false);
  const [profileData, setProfileData] = useState(mockProfileData);

  const updatePersonalInfo = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const updateWorkshopDetails = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      workshopDetails: {
        ...prev.workshopDetails,
        [field]: value,
      },
    }));
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
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.iconBtn}>
          <EditIcon />
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
            {profileData.avatar ? (
              <Image
                source={{uri: profileData.avatar}}
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
                value={profileData.workshopDetails.gstNumber}
                onChange={v => updateWorkshopDetails('gstNumber', v)}
                editable={isEditing}
              />
              <FloatingInput
                label="Trade License"
                value={profileData.workshopDetails.tradeLicense}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
