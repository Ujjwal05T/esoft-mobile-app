import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import FloatingInput from '../ui/FloatingInput';

interface GateOutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  vehicleInfo?: {
    plateNumber: string;
    vehicleName: string;
  };
}

export default function GateOutOverlay({
  isOpen,
  onClose,
  onComplete,
  vehicleInfo,
}: GateOutOverlayProps) {
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');

  const isValid = driverName.trim() !== '' && odometer.trim() !== '';

  const handleSubmit = () => {
    if (!isValid) return;
    onComplete?.();
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Gate Out</Text>
        {vehicleInfo && (
          <Text style={styles.vehicleInfo}>
            {vehicleInfo.vehicleName} • {vehicleInfo.plateNumber}
          </Text>
        )}

        <ScrollView showsVerticalScrollIndicator={false} style={styles.form}>
          <FloatingInput
            label="Driver Name"
            value={driverName}
            onChange={setDriverName}
            required
          />
          <FloatingInput
            label="Driver Contact"
            value={driverContact}
            onChange={setDriverContact}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <FloatingInput
            label="Odometer Reading"
            value={odometer}
            onChange={setOdometer}
            keyboardType="numeric"
            required
          />
          <FloatingInput
            label="Fuel Level (%)"
            value={fuelLevel}
            onChange={setFuelLevel}
            keyboardType="numeric"
            maxLength={3}
          />
        </ScrollView>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid}
            style={[styles.submitBtn, !isValid && styles.disabledBtn]}>
            <Text style={styles.submitText}>Gate Out</Text>
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
    maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#d1d5db',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  title: {fontSize: 20, fontWeight: '700', color: '#e5383b', marginBottom: 4},
  vehicleInfo: {fontSize: 14, color: '#666666', marginBottom: 16},
  form: {flex: 1},
  buttons: {flexDirection: 'row', gap: 12, marginTop: 16},
  cancelBtn: {
    flex: 1, height: 52, borderRadius: 8,
    borderWidth: 1, borderColor: '#d4d9e3',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: {fontSize: 14, fontWeight: '600', color: '#666666'},
  submitBtn: {
    flex: 1, height: 52, borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center', justifyContent: 'center',
  },
  disabledBtn: {backgroundColor: '#d1d5db'},
  submitText: {fontSize: 14, fontWeight: '600', color: '#ffffff'},
});
