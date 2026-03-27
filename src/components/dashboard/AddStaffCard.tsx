import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ArrowDiagonalIcon from '../../assets/icons/arrow-diagonal.svg';

interface AddStaffCardProps {
  onPress?: () => void;
}

export default function AddStaffCard({onPress}: AddStaffCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <LinearGradient
        colors={['#e5383b', '#bb282b']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.gradient}>
        {/* Background staff silhouette */}
        <Image
          source={require('../../assets/images/twin-brothers.png')}
          style={styles.staffSilhouette}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>Add a New{'\n'}Staff</Text>

        {/* Arrow Icon */}
        <View style={styles.arrowContainer}>
          <ArrowDiagonalIcon width={32} height={32} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 155,
    borderRadius: 9,
    width: '100%',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  staffSilhouette: {
    position: 'absolute',
    right: -20,
    top: -10,
    width: 220,
    height: 200,
  },
  title: {
    position: 'absolute',
    left: 11,
    top: 21,
    fontWeight: '900',
    fontSize: 30,
    color: '#ffffff',
    letterSpacing: -1.28,
    lineHeight: 36,
    width: 169,
  },
  arrowContainer: {
    position: 'absolute',
    left: 11,
    top: 103,
    width: 32,
    height: 32,
  },
});
