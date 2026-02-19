import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {SERVER_ORIGIN} from '../../services/api';

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

const PauseIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="5" width="4" height="14" rx="1" fill="white" />
    <Rect x="14" y="5" width="4" height="14" rx="1" fill="white" />
  </Svg>
);

const audioRecorderPlayer = AudioRecorderPlayer;

export default function JobCard({
  jobCategory,
  assignedStaffName,
  remark,
  audioUrl,
  images,
  createdAt,
  onClick,
}: JobCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const fullAudioUrl = audioUrl
    ? audioUrl.startsWith('http')
      ? audioUrl
      : `${SERVER_ORIGIN}${audioUrl}`
    : null;

  const maxVisibleImages = 2;
  const visibleImages = images?.slice(0, maxVisibleImages) || [];
  const overflowCount = (images?.length || 0) - maxVisibleImages;
  const hasAudio = !!fullAudioUrl;
  const hasMedia = visibleImages.length > 0 || overflowCount > 0 || hasAudio;

  // Stop player when component unmounts
  useEffect(() => {
    return () => {
      if (isPlaying) {
        audioRecorderPlayer.stopPlayer().catch(() => {});
        audioRecorderPlayer.removePlayBackListener();
      }
    };
  }, [isPlaying]);

  const handlePlayPause = async () => {
    if (!fullAudioUrl) return;

    if (isPlaying) {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setIsPlaying(false);
    } else {
      await audioRecorderPlayer.startPlayer(fullAudioUrl);
      audioRecorderPlayer.addPlayBackListener(e => {
        if (e.duration > 0 && e.currentPosition >= e.duration) {
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
          setIsPlaying(false);
        }
      });
      setIsPlaying(true);
    }
  };

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
      {hasMedia && (
        <View style={styles.mediaRow}>
          {visibleImages.map((url, idx) => (
            <View key={idx} style={styles.mediaThumb}>
              <Image
                source={{uri: `${SERVER_ORIGIN}${url}`}}
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
          {hasAudio && (
            <TouchableOpacity
              onPress={handlePlayPause}
              style={[styles.playBtn, isPlaying && styles.playBtnPaused]}
              activeOpacity={0.8}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </TouchableOpacity>
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
  playBtnPaused: {
    backgroundColor: '#c82d30',
  },
});
