import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Svg, {Path, Circle} from 'react-native-svg';

interface VehicleTypeSelectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExisting: () => void;
  onSelectNew: () => void;
}

export default function VehicleTypeSelectionOverlay({
  isOpen,
  onClose,
  onSelectExisting,
  onSelectNew,
}: VehicleTypeSelectionOverlayProps) {
  const {t} = useTranslation();
  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>{t('vehicle_type_selection.title')}</Text>
        <Text style={styles.subtitle}>{t('vehicle_type_selection.subtitle')}</Text>

        <TouchableOpacity style={styles.option} onPress={onSelectExisting} activeOpacity={0.8}>
          <View style={styles.iconWrap}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 17H5C3.895 17 3 16.105 3 15V9C3 7.895 3.895 7 5 7H19C20.105 7 21 7.895 21 9V15C21 16.105 20.105 17 19 17Z"
                stroke="#e5383b"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx="7.5" cy="17" r="1.5" fill="#e5383b" />
              <Circle cx="16.5" cy="17" r="1.5" fill="#e5383b" />
              <Path
                d="M5 10L7 7H17L19 10"
                stroke="#e5383b"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{t('vehicle_type_selection.existing_title')}</Text>
            <Text style={styles.optionDesc}>{t('vehicle_type_selection.existing_desc')}</Text>
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 18L15 12L9 6"
              stroke="#828282"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={onSelectNew} activeOpacity={0.8}>
          <View style={styles.iconWrap}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5V19M5 12H19"
                stroke="#e5383b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{t('vehicle_type_selection.new_title')}</Text>
            <Text style={styles.optionDesc}>{t('vehicle_type_selection.new_desc')}</Text>
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 18L15 12L9 6"
              stroke="#828282"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  handle: {
    width: 172,
    height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#828282',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#fff0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    color: '#828282',
  },
});
