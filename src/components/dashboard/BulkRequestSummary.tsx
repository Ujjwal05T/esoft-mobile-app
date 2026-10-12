import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image, Linking} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {useTranslation} from 'react-i18next';
import type {InquiryAttachmentResponse} from '../../services/api';

interface BulkRequestSummaryProps {
  requestText?: string | null;
  attachments?: InquiryAttachmentResponse[];
  // True while an admin hasn't itemised the request yet
  awaitingItems?: boolean;
  // When set, an Edit link lets the customer amend the request text
  onEdit?: () => void;
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const PlayIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M8 5V19L19 12L8 5Z" fill="white" />
  </Svg>
);

const PauseIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="5" width="4" height="14" rx="1" fill="white" />
    <Rect x="14" y="5" width="4" height="14" rx="1" fill="white" />
  </Svg>
);

const PdfIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z"
      stroke="#e5383b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2V8H20" stroke="#e5383b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function BulkRequestSummary({requestText, attachments = [], awaitingItems, onEdit}: BulkRequestSummaryProps) {
  const {t} = useTranslation();
  const [playingId, setPlayingId] = useState<number | null>(null);

  // Stop any playback when leaving the screen
  useEffect(() => () => {
    AudioRecorderPlayer.stopPlayer().catch(() => {});
  }, []);

  const togglePlay = async (att: InquiryAttachmentResponse) => {
    try {
      if (playingId === att.id) {
        await AudioRecorderPlayer.stopPlayer();
        setPlayingId(null);
        return;
      }
      if (playingId !== null) await AudioRecorderPlayer.stopPlayer();
      await AudioRecorderPlayer.startPlayer(att.url);
      setPlayingId(att.id);
      AudioRecorderPlayer.addPlayBackListener(e => {
        if (e.currentPosition >= e.duration) setPlayingId(null);
      });
    } catch (e) {
      console.error('playback error', e);
      setPlayingId(null);
    }
  };

  const hasContent = !!requestText?.trim() || attachments.length > 0 || !!onEdit;

  return (
    <View style={styles.wrap}>
      {awaitingItems && (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{t('bulk_request.awaiting_title')}</Text>
          <Text style={styles.bannerBody}>{t('bulk_request.awaiting_body')}</Text>
        </View>
      )}

      {hasContent && (
        <View style={styles.card}>
          <View style={styles.headingRow}>
            <Text style={styles.heading}>{t('bulk_request.your_request')}</Text>
            {!!onEdit && (
              <TouchableOpacity onPress={onEdit} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.link}>{t('bulk_request.edit_request')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {!!requestText?.trim() && <Text style={styles.text}>{requestText.trim()}</Text>}

          {attachments.map(att => {
            if (att.kind === 'image') {
              return (
                <TouchableOpacity key={att.id} onPress={() => Linking.openURL(att.url)} activeOpacity={0.8}>
                  <Image source={{uri: att.url}} style={styles.image} resizeMode="cover" />
                </TouchableOpacity>
              );
            }
            if (att.kind === 'pdf') {
              return (
                <TouchableOpacity
                  key={att.id}
                  onPress={() => Linking.openURL(att.url)}
                  style={styles.row}
                  activeOpacity={0.8}>
                  <PdfIcon />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {att.fileName || 'document.pdf'}
                  </Text>
                  <Text style={styles.link}>{t('bulk_request.open_pdf')}</Text>
                </TouchableOpacity>
              );
            }
            return (
              <View key={att.id} style={styles.row}>
                <TouchableOpacity onPress={() => togglePlay(att)} style={styles.playBtn}>
                  {playingId === att.id ? <PauseIcon /> : <PlayIcon />}
                </TouchableOpacity>
                <Text style={styles.fileName}>{t('bulk_request.voice_note')}</Text>
                {!!att.audioDuration && <Text style={styles.duration}>{formatTime(att.audioDuration)}</Text>}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: 12},
  banner: {
    backgroundColor: '#fff7e6',
    borderColor: '#f5c26b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  bannerTitle: {fontSize: 15, fontWeight: '700', color: '#8a5a00'},
  bannerBody: {fontSize: 13, color: '#8a5a00', marginTop: 4, lineHeight: 18},
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 14,
    gap: 12,
  },
  headingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  heading: {fontSize: 13, fontWeight: '700', color: '#828282', textTransform: 'uppercase'},
  text: {fontSize: 15, color: '#000', lineHeight: 21},
  image: {width: '100%', height: 180, borderRadius: 10, backgroundColor: '#f3f3f3'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 10,
    padding: 10,
  },
  fileName: {flex: 1, fontSize: 14, color: '#333'},
  link: {fontSize: 13, fontWeight: '600', color: '#e5383b'},
  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {fontSize: 13, color: '#828282'},
});
