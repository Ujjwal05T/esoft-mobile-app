import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';

interface ContactETNAOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
  email?: string;
  phone?: string;
}

const WhatsAppIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#25D366" />
  </Svg>
);

const EmailIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#e5383b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 6l-10 7L2 6" stroke="#e5383b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhoneIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.52 10.5a19.79 19.79 0 01-3.07-8.62A2 2 0 012.44 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.4a16 16 0 006.09 6.09l.77-.77a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="#e5383b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function ContactETNAOverlay({
  isOpen,
  onClose,
  whatsappNumber = '+911234567890',
  email = 'support@etna.com',
  phone = '+911234567890',
}: ContactETNAOverlayProps) {
  const contactOptions = [
    {
      icon: <WhatsAppIcon />,
      label: 'WhatsApp',
      action: () => Linking.openURL(`whatsapp://send?phone=${whatsappNumber}`),
    },
    {
      icon: <EmailIcon />,
      label: 'Email',
      action: () => Linking.openURL(`mailto:${email}`),
    },
    {
      icon: <PhoneIcon />,
      label: 'Call',
      action: () => Linking.openURL(`tel:${phone}`),
    },
  ];

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Contact ETNA</Text>
        <Text style={styles.subtitle}>Choose how you'd like to reach us</Text>

        <View style={styles.options}>
          {contactOptions.map((opt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                opt.action();
                onClose();
              }}
              style={styles.optionBtn}
              activeOpacity={0.8}>
              <View style={styles.optionIcon}>{opt.icon}</View>
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#d1d5db',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  title: {fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 4},
  subtitle: {fontSize: 14, color: '#666666', marginBottom: 24},
  options: {gap: 12},
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#f0f0f0', backgroundColor: '#fafafa',
  },
  optionIcon: {width: 24, height: 24},
  optionLabel: {fontSize: 16, fontWeight: '500', color: '#1a1a1a'},
  cancelBtn: {
    marginTop: 16, height: 48, borderRadius: 8,
    borderWidth: 1, borderColor: '#d4d9e3',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: {fontSize: 14, fontWeight: '600', color: '#666666'},
});
