import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import ArrowDiagonalIcon from '../../assets/icons/arrow-diagonal.svg';

interface StatusCardProps {
  title: string;
  value: string | number;
  bgColor: string;
  onPress?: () => void;
  VectorIcon?: React.FC<{width?: number; height?: number; opacity?: number}>;
  vectorWidth?: number;
  vectorHeight?: number;
  vectorTop?: number;
  vectorOpacity?: number;
}



export default function StatusCard({
  title,
  value,
  bgColor,
  onPress,
  VectorIcon,
  vectorWidth = 147,
  vectorHeight = 130,
  vectorTop = 25,
  vectorOpacity = 0.35,
}: StatusCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, {backgroundColor: bgColor}]}>
      {VectorIcon && (
        <View style={[styles.vectorContainer, {top: vectorTop}]}>
          <VectorIcon
            width={vectorWidth}
            height={vectorHeight}
            opacity={vectorOpacity}
          />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.arrowContainer}>
        <ArrowDiagonalIcon width={32} height={32} />
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 155,
    borderRadius: 9,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    padding: 10,
  },
  title: {
    position: 'absolute',
    left: 10,
    top: 25,
    fontWeight: '600',
    fontSize: 16,
    color: '#f5f3f4',
    letterSpacing: -0.64,
  },
  value: {
    position: 'absolute',
    left: 7,
    top: 77,
    fontWeight: '800',
    fontSize: 65,
    color: '#f5f3f4',
    letterSpacing: -2.6,
    lineHeight: 66,
  },
  vectorContainer: {
    position: 'absolute',
    right: 0,
  },
  arrowContainer: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
});
