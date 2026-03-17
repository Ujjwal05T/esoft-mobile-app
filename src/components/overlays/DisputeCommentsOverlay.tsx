import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {
  getDisputeComments,
  addDisputeComment,
  getDisputeById,
  DisputeCommentResponse,
  DisputeDetailResponse,
  DisputeAttachmentResponse,
  SERVER_ORIGIN,
} from '../../services/api';
import {useAuth} from '../../context/AuthContext';

const SCREEN_H = Dimensions.get('screen').height;

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronIcon = ({expanded}: {expanded: boolean}) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d={expanded ? 'M18 15L12 9L6 15' : 'M6 9L12 15L18 9'}
      stroke="#1a1a1a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlayIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M8 5L19 12L8 19V5Z" fill="white" />
  </Svg>
);

const PauseIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="5" width="4" height="14" rx="1" fill="white" />
    <Rect x="14" y="5" width="4" height="14" rx="1" fill="white" />
  </Svg>
);

const SendIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface DisputeCommentsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: number;
  /** Pre-filled dispute detail (optional – will be fetched if not supplied) */
  disputeDetail?: DisputeDetailResponse;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
  } catch {
    return '';
  }
}

function isEtnaComment(comment: DisputeCommentResponse): boolean {
  // Comments from ETNA team: role contains "Admin" / "SalesPerson" or isInternal
  const role = comment.senderRole?.toLowerCase() ?? '';
  return (
    role.includes('admin') ||
    role.includes('salesperson') ||
    role.includes('etna') ||
    comment.isInternal
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const audioRecorderPlayer = AudioRecorderPlayer;

const BAR_HEIGHTS = [6, 10, 14, 10, 18, 12, 8, 16, 10, 14, 18, 8, 12, 16, 10,
                     6,  8, 14, 18, 12, 10, 16,  8, 14, 10, 18, 12,  6, 10, 14];

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const AudioPlayer = ({url}: {url: string}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const fullUrl = url.startsWith('http') ? url : `${SERVER_ORIGIN}${url}`;

  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopPlayer().catch(() => {});
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setIsPlaying(false);
    } else {
      await audioRecorderPlayer.startPlayer(fullUrl);
      audioRecorderPlayer.addPlayBackListener(e => {
        setCurrentMs(e.currentPosition);
        setDurationMs(e.duration);
        if (e.duration > 0 && e.currentPosition >= e.duration) {
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
          setIsPlaying(false);
          setCurrentMs(0);
        }
      });
      setIsPlaying(true);
    }
  };

  const progressRatio = durationMs > 0 ? currentMs / durationMs : 0;
  const activeBars = Math.round(progressRatio * BAR_HEIGHTS.length);

  return (
    <View style={styles.audioPlayer}>
      <TouchableOpacity style={styles.audioPlayBtn} onPress={handlePlayPause} activeOpacity={0.8}>
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </TouchableOpacity>
      <View style={styles.waveform}>
        {BAR_HEIGHTS.map((h, i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              {height: h},
              i < activeBars && styles.waveBarActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.audioDuration}>
        {isPlaying ? formatDuration(currentMs) : durationMs > 0 ? formatDuration(durationMs) : '0:00'}
      </Text>
    </View>
  );
};

const ImageGrid = ({attachments}: {attachments: DisputeAttachmentResponse[]}) => {
  const images = attachments.filter(a => a.fileType === 'image');
  if (images.length === 0) return null;

  return (
    <View style={styles.imageGrid}>
      {images.map(img => {
        const src = img.fileUrl.startsWith('http')
          ? img.fileUrl
          : `${SERVER_ORIGIN}/${img.fileUrl}`;
        return (
          <Image
            key={img.id}
            source={{uri: src}}
            style={styles.gridImage}
            resizeMode="cover"
          />
        );
      })}
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DisputeCommentsOverlay({
  isOpen,
  onClose,
  disputeId,
  disputeDetail: propDetail,
}: DisputeCommentsOverlayProps) {
  const {user} = useAuth();
  const [detail, setDetail] = useState<DisputeDetailResponse | null>(propDetail ?? null);
  const [comments, setComments] = useState<DisputeCommentResponse[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  // Success flash
  const [showSuccess, setShowSuccess] = useState(false);
  const successFade = useRef(new Animated.Value(0)).current;

  const scrollRef = useRef<ScrollView>(null);

  const fetchDetail = useCallback(async () => {
    if (propDetail) {
      setDetail(propDetail);
      return;
    }
    setLoadingDetail(true);
    const res = await getDisputeById(disputeId);
    if (res.success && res.data) {
      setDetail(res.data);
    }
    setLoadingDetail(false);
  }, [disputeId, propDetail]);

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    const res = await getDisputeComments(disputeId);
    if (res.success && res.data) {
      setComments(res.data);
    }
    setLoadingComments(false);
  }, [disputeId]);

  useEffect(() => {
    if (isOpen && disputeId) {
      fetchDetail();
      fetchComments();
    }
    if (!isOpen) {
      setCommentText('');
      setShowSuccess(false);
      successFade.setValue(0);
    }
  }, [isOpen, disputeId]);

  const handleSend = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const res = await addDisputeComment(disputeId, trimmed, false, user?.name, user?.role);
    setSending(false);

    if (res.success) {
      setCommentText('');
      // Optimistically add comment locally, then refresh
      const optimistic: DisputeCommentResponse = {
        id: Date.now(),
        disputeId,
        senderName: user?.name ?? 'You',
        senderRole: user?.role ?? 'Workshop',
        message: trimmed,
        isInternal: false,
        createdAt: new Date().toISOString(),
      };
      setComments(prev => [...prev, optimistic]);
      setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100);

      // Flash success
      setShowSuccess(true);
      Animated.sequence([
        Animated.timing(successFade, {toValue: 1, duration: 200, useNativeDriver: true}),
        Animated.delay(800),
        Animated.timing(successFade, {toValue: 0, duration: 300, useNativeDriver: true}),
      ]).start(() => setShowSuccess(false));
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────

  const audioAttachment = detail?.attachments?.find(a => a.fileType === 'audio');
  const commentCount = comments.length;
  const hasNewEtnaComments = comments.some(isEtnaComment);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kavWrapper}>
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {loadingDetail ? (
            <View style={styles.centeredLoader}>
              <ActivityIndicator size="large" color="#e5383b" />
            </View>
          ) : (
            <>
              {/* ── Part name / title ─────────────────────────────── */}
              <Text style={styles.partName} numberOfLines={1}>
                {detail?.partName || detail?.subject || 'Dispute Details'}
              </Text>

              <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}>

                {/* ── Image grid ──────────────────────────────────── */}
                {detail?.attachments && <ImageGrid attachments={detail.attachments} />}

                {/* ── Detail grid ─────────────────────────────────── */}
                {detail && (
                  <View style={styles.fieldsGrid}>
                    {/* Row 1 */}
                    <View style={styles.row}>
                      <InfoField
                        label="Price"
                        value={detail.unitPrice != null ? `Rs ${detail.unitPrice}` : '—'}
                        active
                      />
                      <InfoField
                        label="Quantity"
                        value={detail.quantity != null ? String(detail.quantity) : '—'}
                        active
                      />
                    </View>
                    {/* Row 2 */}
                    <View style={styles.row}>
                      <InfoField label="Brand" value={detail.brand ?? '—'} active />
                      <InfoField label="Reason" value={detail.reason || detail.category || '—'} active />
                    </View>
                  </View>
                )}

                {/* ── Audio player ─────────────────────────────────── */}
                {audioAttachment && <AudioPlayer url={audioAttachment.fileUrl} />}

                {/* ── Comments section ────────────────────────────── */}
                <TouchableOpacity
                  style={styles.commentsHeader}
                  onPress={() => setCommentsExpanded(v => !v)}
                  activeOpacity={0.7}>
                  <View style={styles.commentsHeaderLeft}>
                    <Text style={styles.commentsTitle}>Comments</Text>
                    {commentCount > 0 && !commentsExpanded && (
                      <View style={styles.commentBadge}>
                        <Text style={styles.commentBadgeText}>
                          +{commentCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <ChevronIcon expanded={commentsExpanded} />
                </TouchableOpacity>

                {commentsExpanded && (
                  <View style={styles.commentsList}>
                    {loadingComments ? (
                      <ActivityIndicator
                        size="small"
                        color="#e5383b"
                        style={{marginVertical: 12}}
                      />
                    ) : comments.length === 0 ? (
                      <Text style={styles.noComments}>No comments yet</Text>
                    ) : (
                      comments.map(c => {
                        const etna = isEtnaComment(c);
                        return (
                          <View key={c.id} style={styles.commentItem}>
                            <View style={styles.commentMeta}>
                              <Text
                                style={[
                                  styles.commentSender,
                                  etna && styles.commentSenderEtna,
                                ]}>
                                {etna ? 'By ETNA' : c.senderName}
                              </Text>
                              <Text style={styles.commentTime}>
                                {formatTime(c.createdAt)}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.commentMessage,
                                etna && styles.commentMessageEtna,
                              ]}>
                              {c.message}
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}

                {/* ── Comment input ─────────────────────────────────── */}
                <View style={styles.inputWrapper}>
                  <View style={styles.floatLabelContainer}>
                    <Text style={styles.floatLabel}>Send Comment</Text>
                  </View>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="150 mm agaya hai."
                    placeholderTextColor="#acacac"
                    style={styles.commentInput}
                    multiline
                    maxLength={500}
                  />
                </View>

                {/* bottom padding so input stays above the send button */}
                <View style={{height: 24}} />
              </ScrollView>

              {/* ── Send button (pinned) ──────────────────────────── */}
              <View style={styles.sendBtnContainer}>
                <TouchableOpacity
                  style={[styles.sendBtn, (!commentText.trim() || sending) && styles.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={!commentText.trim() || sending}
                  activeOpacity={0.85}>
                  {sending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.sendBtnText}>SEND COMMENT</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Success flash toast */}
              {showSuccess && (
                <Animated.View style={[styles.successToast, {opacity: successFade}]}>
                  <Text style={styles.successToastText}>Comment sent ✓</Text>
                </Animated.View>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Info field (floating label read-only) ────────────────────────────────────

const InfoField = ({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) => {
  const borderColor = active ? '#e5383b' : '#dadada';
  const labelColor = active ? '#000' : '#9e9e9e';
  return (
    <View style={fieldStyles.container}>
      <View style={[fieldStyles.input, {borderColor}]}>
        <Text style={fieldStyles.value} numberOfLines={1}>
          {value || '–'}
        </Text>
      </View>
      <View style={fieldStyles.labelWrap}>
        <Text style={[fieldStyles.label, {color: labelColor}]}>{label}</Text>
      </View>
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  container: {flex: 1, position: 'relative'},
  input: {
    height: 53,
    borderWidth: 1,
    borderRadius: 6.5,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  value: {fontSize: 14, fontWeight: '500', color: '#000'},
  labelWrap: {
    position: 'absolute',
    left: 12,
    top: -8,
    backgroundColor: '#fff',
    paddingHorizontal: 2,
  },
  label: {fontSize: 10},
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kavWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    maxHeight: SCREEN_H * 0.92,
  },
  handle: {
    width: 172,
    height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 23,
    alignSelf: 'center',
    marginBottom: 12,
  },
  centeredLoader: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Part name title
  partName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#323232',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // Fields grid
  fieldsGrid: {gap: 16, marginBottom: 16,marginTop: 4},
  row: {flexDirection: 'row', gap: 16},
  // Image grid
  imageGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  gridImage: {
    flex: 1,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  // Audio player
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  audioPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  waveBar: {
    flex: 1,
    backgroundColor: '#c0c0c0',
    borderRadius: 2,
    maxWidth: 3,
  },
  waveBarActive: {
    backgroundColor: '#e5383b',
  },
  audioDuration: {fontSize: 12, color: '#555', minWidth: 30, textAlign: 'right'},
  // Comments header
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  commentsHeaderLeft: {flexDirection: 'row', alignItems: 'center', gap: 8},
  commentsTitle: {fontSize: 14, fontWeight: '600', color: '#1a1a1a'},
  commentBadge: {
    backgroundColor: '#e5383b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  commentBadgeText: {fontSize: 11, color: '#fff', fontWeight: '600'},
  // Comments list
  commentsList: {gap: 12, marginBottom: 16},
  noComments: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 12,
  },
  commentItem: {gap: 2},
  commentMeta: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  commentSender: {fontSize: 13, fontWeight: '600', color: '#1a1a1a'},
  commentSenderEtna: {color: '#e5383b'},
  commentTime: {fontSize: 11, color: '#acacac'},
  commentMessage: {fontSize: 13, color: '#333', lineHeight: 18},
  commentMessageEtna: {color: '#e5383b'},
  // Input
  inputWrapper: {
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 12,
    position: 'relative',
    minHeight: 60,
  },
  floatLabelContainer: {
    position: 'absolute',
    left: 12,
    top: -8,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
  },
  floatLabel: {fontSize: 11, color: '#828282'},
  commentInput: {
    fontSize: 14,
    color: '#1a1a1a',
    padding: 0,
    textAlignVertical: 'top',
  },
  // Send button
  sendBtnContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  sendBtn: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {opacity: 0.55},
  sendBtnText: {color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.8},
  // Success toast
  successToast: {
    position: 'absolute',
    bottom: 76,
    left: 24,
    right: 24,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  successToastText: {color: '#fff', fontWeight: '600', fontSize: 13},
});
