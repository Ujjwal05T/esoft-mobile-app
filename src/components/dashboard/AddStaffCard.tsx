import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ArrowDiagonalIcon from '../../assets/icons/arrow-diagonal.svg';
import {useTranslation} from 'react-i18next';

interface AddStaffCardProps {
  onPress?: () => void;
}

export default function AddStaffCard({onPress}: AddStaffCardProps) {
  const {t} = useTranslation();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <View style={styles.gradient}>
        {/* Background staff silhouette */}
        <Image
          source={require('../../assets/images/add-staff-card.png')}
          style={styles.staffSilhouette}
          resizeMode="cover"
        />

        {/* Title */}
        <Text style={styles.title}>{t('staff.add_new')}</Text>

        {/* Arrow Icon */}
        <View style={styles.arrowContainer}>
          <ArrowDiagonalIcon width={32} height={32} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 65,
    borderRadius: 9,
    width: '100%',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ffad2a',
  },
  staffSilhouette: {
    position: 'absolute',
    opacity: 0.19,
    width: 400,
    height: 100,
  },
  title: {
    position: 'absolute',
    left: 11,
    top: 15,
    fontWeight: '900',
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: -1.28,
    lineHeight: 36,
    width: 250,
  },
  arrowContainer: {
    position: 'absolute',
    right: 12,
    top: 15,
    width: 35,
    height: 35,
  },
});
