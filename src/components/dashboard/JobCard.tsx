import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Svg, {Path} from 'react-native-svg';

export interface JobCardProps {
  id: number;
  jobCategory: string;
  assignedStaffName?: string;
  remark?: string;
  audioUrl?: string;
  images?: string[];
  videos?: string[];
  createdAt: string;
  status?: string;
  onClick?: () => void;
}

const PlayIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M8 5v14l11-7z" fill="white" />
  </Svg>
);

const API_BASE = 'http://localhost:5196';

export default function JobCard({
  jobCategory,
  assignedStaffName,
  remark,
  audioUrl,
  images,
  videos,
  createdAt,
  onClick,
}: JobCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const maxVisibleImages = 2;
  const visibleImages = images?.slice(0, maxVisibleImages) || [];
  const overflowCount = (images?.length || 0) - maxVisibleImages;
  const hasAudioOrVideo = audioUrl || (videos && videos.length > 0);

  return (
    <TouchableOpacity
      onPress={onClick}
      activeOpacity={0.85}
      style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.category}>{jobCategory}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Assigned To: </Text>
          <Text style={styles.metaValue}>
            {assignedStaffName || 'Unassigned'}
          </Text>
          <Text style={[styles.metaLabel, styles.ml8]}>{formattedDate}</Text>
        </View>
      </View>

      {/* Remark */}
      {!!remark && <Text style={styles.remark}>{remark}</Text>}

      {/* Media */}
      {(visibleImages.length > 0 || overflowCount > 0 || hasAudioOrVideo) && (
        <View style={styles.mediaRow}>
          {visibleImages.map((url, idx) => (
            <View key={idx} style={styles.mediaThumb}>
              <Image
                source={{uri: `${API_BASE}${url}`}}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            </View>
          ))}
          {overflowCount > 0 && (
            <View style={styles.overflowBox}>
              <Text style={styles.overflowText}>+{overflowCount}</Text>
            </View>
          )}
          {hasAudioOrVideo && (
            <View style={styles.playBtn}>
              <PlayIcon />
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    marginBottom: 12,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5383b',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaLabel: {
    fontSize: 12,
    color: '#99a2b6',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2b2b2b',
  },
  ml8: {
    marginLeft: 8,
  },
  remark: {
    fontSize: 15,
    color: '#2b2b2b',
    marginBottom: 16,
    lineHeight: 21,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mediaThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  overflowBox: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f5f3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#99a2b6',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
