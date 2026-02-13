import React from 'react';
import {View, Text, StyleSheet, ImageBackground} from 'react-native';

interface EventCardProps {
  title?: string;
  date?: string;
  time?: string;
  venue?: string;
  imageSrc?: string;
}

export default function EventCard({
  title = 'Valvoline Mechanic Meet',
  date = '12 December 2025',
  time = '7 PM - 10 PM',
  venue = 'Sayaji Effotel',
  imageSrc,
}: EventCardProps) {
  const content = (
    <View style={styles.contentOverlay}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.details}>
        {date} • {time} • {venue}
      </Text>
    </View>
  );

  if (imageSrc) {
    return (
      <ImageBackground
        source={{uri: imageSrc}}
        style={styles.card}
        imageStyle={styles.image}>
        <View style={styles.gradient}>{content}</View>
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.card, styles.fallbackBg]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 16,
  },
  fallbackBg: {
    backgroundColor: '#e5383b',
    justifyContent: 'flex-end',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(229,56,59,0.6)',
  },
  contentOverlay: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  details: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 17,
  },
});
