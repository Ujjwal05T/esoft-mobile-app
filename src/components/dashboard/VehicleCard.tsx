import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TOYOTA_CRYSTA = require('../../assets/images/toyota-crysta.png') as number;

interface VehicleCardProps {
  plateNumber: string;
  year?: number;
  make: string;
  model: string;
  specs: string;
  services?: string[];
  additionalServices?: number;
  variant?: 'default' | 'compact' | 'scan' | 'approve-big';
  addedBy?: string;
  onApprove?: () => void;
  onView?: () => void;
}

const CheckIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 13l4 4L19 7"
      stroke="white"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      stroke="#161a1d"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      stroke="#161a1d"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export default function VehicleCard({
  plateNumber,
  year,
  make,
  model,
  specs,
  services = [],
  additionalServices = 0,
  variant = 'default',
  addedBy,
  onApprove,
  onView,
}: VehicleCardProps) {
  const vehicleName = [year, make, model].filter(Boolean).join(' ');

  const ServiceTags = () => (
    <View style={styles.tagsRow}>
      {services.slice(0, 2).map((s, i) => (
        <View key={i} style={styles.serviceTag}>
          <Text style={styles.serviceTagText}>{s}</Text>
        </View>
      ))}
      {additionalServices > 0 && (
        <View style={styles.serviceTagMore}>
          <Text style={styles.serviceTagText}>+{additionalServices}</Text>
        </View>
      )}
    </View>
  );

  // Compact variant
  if (variant === 'compact') {
    return (
      <LinearGradient
        colors={['#ffffff', '#d4d9e3']}
        start={{x: 0.1, y: 1}}
        end={{x: 0.9, y: 0}}
        style={styles.compactCard}>
        <View style={styles.compactTop}>
          <View style={styles.flex1}>
            <Text style={styles.vehicleNameRed}>{vehicleName}</Text>
            <Text style={styles.specs}>{specs}</Text>
          </View>
          <View style={styles.plateBadgeWhite}>
            <Text style={styles.plateTextRed}>{plateNumber}</Text>
          </View>
        </View>
        {services.length > 0 && <ServiceTags />}
      </LinearGradient>
    );
  }

  // Scan variant
  if (variant === 'scan') {
    return (
      <View style={styles.scanCard}>
        {/* Vehicle Image */}
        <View style={styles.imageSection}>
          <Image
            source={TOYOTA_CRYSTA}
            style={styles.vehicleImage}
            resizeMode="cover"
          />
          <View style={styles.plateBadgeGray}>
            <Text style={styles.plateTextDark}>{plateNumber}</Text>
          </View>
        </View>

        <View style={styles.scanInfo}>
          {addedBy && <Text style={styles.addedBy}>Added by {addedBy}</Text>}
          <Text style={styles.vehicleNameDark}>{vehicleName}</Text>
          <Text style={styles.specs}>{specs}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={onApprove}
            style={[styles.approveBtn, styles.roundedBL]}
            activeOpacity={0.8}>
            <CheckIcon />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onView}
            style={[styles.viewBtnLight, styles.roundedBR]}
            activeOpacity={0.8}>
            <EyeIcon />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Approve-big variant
  if (variant === 'approve-big') {
    return (
      <LinearGradient
        colors={['#ffffff', '#b2b9c8']}
        start={{x: 0.1, y: 1}}
        end={{x: 0.9, y: 0}}
        locations={[0.45, 0.96]}
        style={styles.approveBigCard}>
        <View style={styles.approveBigTop}>
          <Image
            source={TOYOTA_CRYSTA}
            style={styles.approveBigImage}
            resizeMode="contain"
          />
          <View style={styles.flex1}>
            {addedBy && <Text style={styles.addedBy}>Added by {addedBy}</Text>}
            <Text style={styles.vehicleNameDark}>{vehicleName}</Text>
            <Text style={styles.specsSmall}>{specs}</Text>
          </View>
          <View style={styles.plateBadgeWhite}>
            <Text style={styles.plateTextRed}>{plateNumber}</Text>
          </View>
        </View>
        <View style={styles.approveBigActions}>
          <TouchableOpacity
            onPress={onApprove}
            style={[styles.approveBtn, styles.flex1, styles.rounded7]}
            activeOpacity={0.8}>
            <CheckIcon />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onView}
            style={[styles.viewBtnLight, styles.flex1, styles.rounded7]}
            activeOpacity={0.8}>
            <EyeIcon />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Default variant
  return (
    <LinearGradient
      colors={['#ffffff', '#d4d9e3']}
      start={{x: 0.1, y: 1}}
      end={{x: 0.9, y: 0}}
      style={styles.defaultCard}>
      {/* Vehicle Image Section */}
      <View style={styles.imageSection}>
        <Image
          source={TOYOTA_CRYSTA}
          style={styles.vehicleImage}
          resizeMode="cover"
        />
        <View style={styles.plateBadgeWhiteAbs}>
          <Text style={styles.plateTextRed}>{plateNumber}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.defaultInfo}>
        <Text style={styles.vehicleNameRed}>{vehicleName}</Text>
        <Text style={styles.specs}>{specs}</Text>
        {services.length > 0 && <ServiceTags />}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex1: {flex: 1},
  rounded7: {borderRadius: 7},

  // Default
  defaultCard: {
    borderRadius: 17,
    width: '100%',
    overflow: 'hidden',
  },
  imageSection: {
    height: 140,
    position: 'relative',
  },
  vehicleImage: {
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    bottom: 10,
    height: 100,
    width: '60%',
  },
  plateBadgeWhiteAbs: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#ffffff',
    height: 33,
    paddingHorizontal: 10,
    borderRadius: 7,
    justifyContent: 'center',
  },
  plateTextRed: {
    fontWeight: '700',
    fontSize: 12,
    color: '#e5383b',
    letterSpacing: -0.41,
  },
  defaultInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  vehicleNameRed: {
    fontWeight: '600',
    fontSize: 17,
    color: '#e5383b',
    marginBottom: 4,
  },
  specs: {
    fontSize: 12,
    color: '#99a2b6',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceTag: {
    backgroundColor: '#f0f0f0',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 7,
    justifyContent: 'center',
  },
  serviceTagMore: {
    backgroundColor: '#f0f0f0',
    height: 32,
    width: 46,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#525252',
    letterSpacing: -0.41,
  },

  // Compact
  compactCard: {
    borderRadius: 17,
    width: '100%',
    overflow: 'hidden',
    padding: 12,
    gap: 8,
  },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  plateBadgeWhite: {
    backgroundColor: '#ffffff',
    height: 33,
    paddingHorizontal: 10,
    borderRadius: 7,
    justifyContent: 'center',
    marginLeft: 12,
  },

  // Scan
  scanCard: {
    borderRadius: 17,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  scanInfo: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  addedBy: {
    fontSize: 12,
    color: '#e5383b',
    marginBottom: 4,
  },
  vehicleNameDark: {
    fontWeight: '600',
    fontSize: 17,
    color: '#161a1d',
    marginBottom: 2,
  },
  specsSmall: {
    fontSize: 11,
    color: '#161a1d',
  },
  plateBadgeGray: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#d4d9e3',
    height: 33,
    paddingHorizontal: 10,
    borderRadius: 7,
    justifyContent: 'center',
  },
  plateTextDark: {
    fontWeight: '700',
    fontSize: 12,
    color: '#000000',
    letterSpacing: -0.41,
  },
  actionRow: {
    flexDirection: 'row',
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#161a1d',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnLight: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundedBL: {
    borderBottomLeftRadius: 7,
  },
  roundedBR: {
    borderBottomRightRadius: 7,
  },

  // Approve-big
  approveBigCard: {
    borderRadius: 17,
    width: '100%',
    overflow: 'hidden',
    padding: 12,
  },
  approveBigTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  approveBigImage: {
    width: 10,
    height: 40,
    flexShrink: 0,
  },
  approveBigActions: {
    flexDirection: 'row',
    gap: 8,
  },
});
