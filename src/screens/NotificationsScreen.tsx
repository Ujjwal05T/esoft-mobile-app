import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SectionList,
} from 'react-native';
import Svg, {Path, Circle, Rect, Line} from 'react-native-svg';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/RootNavigator';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from '../services/notificationStorage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {formatDateIST} from '../utils/dateUtils';

// ── Icon helpers ──────────────────────────────────────────────────────────────

type IconType = 'order' | 'quote' | 'inquiry' | 'dispute' | 'bell';

function getIconType(title: string): IconType {
  const t = title.toLowerCase();
  if (t.includes('order')) return 'order';
  if (t.includes('quote')) return 'quote';
  if (t.includes('dispute')) return 'dispute';
  if (t.includes('inquiry') || t.includes('part') || t.includes('request')) return 'inquiry';
  return 'bell';
}

const ICON_STYLES: Record<IconType, {bg: string; fg: string}> = {
  order:   {bg: '#FFF4EC', fg: '#F97316'},
  quote:   {bg: '#EEF2FF', fg: '#6366F1'},
  dispute: {bg: '#FFF1F2', fg: '#E5383B'},
  inquiry: {bg: '#ECFDF5', fg: '#10B981'},
  bell:    {bg: '#F3F4F6', fg: '#6B7280'},
};

function NotifIcon({type, size = 20}: {type: IconType; size?: number}) {
  const {fg} = ICON_STYLES[type];
  const s = size;

  if (type === 'order') {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M21 10H3M16 2L21 10V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V10L8 2H16Z" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M9 15C9 15.5304 9.21071 16.0391 9.58579 16.4142C9.96086 16.7893 10.4696 17 11 17H13C13.5304 17 14.0391 16.7893 14.4142 16.4142C14.7893 16.0391 15 15.5304 15 15C15 14.4696 14.7893 13.9609 14.4142 13.5858C14.0391 13.2107 13.5304 13 13 13H11C10.4696 13 9.96086 12.7893 9.58579 12.4142C9.21071 12.0391 9 11.5304 9 11C9 10.4696 9.21071 9.96086 9.58579 9.58579C9.96086 9.21071 10.4696 9 11 9H13C13.5304 9 14.0391 9.21071 14.4142 9.58579C14.7893 9.96086 15 10.4696 15 11" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
  }

  if (type === 'quote') {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M14 2V8H20" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M16 13H8M16 17H8M10 9H8" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
  }

  if (type === 'dispute') {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M10.29 3.86L1.82 18C1.64 18.32 1.55 18.69 1.55 19.06C1.55 20.14 2.42 21 3.5 21H20.5C21.58 21 22.45 20.14 22.45 19.06C22.45 18.69 22.36 18.32 22.18 18L13.71 3.86C13.34 3.22 12.7 2.86 12 2.86C11.3 2.86 10.66 3.22 10.29 3.86Z" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 9V13" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 17H12.01" stroke={fg} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
  }

  if (type === 'inquiry') {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M21 21L16.65 16.65" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    );
  }

  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

// ── Date grouping ─────────────────────────────────────────────────────────────

type Section = {title: string; data: Notification[]};

function groupByDate(notifs: Notification[]): Section[] {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const older: Notification[] = [];

  for (const n of notifs) {
    if (n.timestamp >= todayStart.getTime()) today.push(n);
    else if (n.timestamp >= yesterdayStart.getTime()) yesterday.push(n);
    else older.push(n);
  }

  const sections: Section[] = [];
  if (today.length) sections.push({title: 'Today', data: today});
  if (yesterday.length) sections.push({title: 'Yesterday', data: yesterday});
  if (older.length) sections.push({title: 'Earlier', data: older});
  return sections;
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDateIST(new Date(timestamp).toISOString());
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const notifs = await getNotifications();
    setNotifications(notifs);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handlePress = async (item: Notification) => {
    await markNotificationAsRead(item.id);
    setNotifications(prev => prev.map(n => n.id === item.id ? {...n, read: true} : n));

    const screen = item.data?.screen;
    if (!screen) return;

    // FCM data values are always strings — parse IDs to numbers before navigating
    switch (screen) {
      case 'QuoteDetail': {
        const quoteId = parseInt(item.data?.quoteId as string, 10);
        if (!isNaN(quoteId)) navigation.navigate('QuoteDetail', {quoteId});
        break;
      }
      case 'InquiryDetail': {
        const inquiryId = parseInt(item.data?.inquiryId as string, 10);
        if (!isNaN(inquiryId)) navigation.navigate('InquiryDetail', {inquiryId});
        break;
      }
      case 'OrderDetail': {
        const orderId = parseInt(item.data?.orderId as string, 10);
        if (!isNaN(orderId)) navigation.navigate('OrderDetail', {orderId});
        break;
      }
    }
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const sections = groupByDate(notifications);

  const renderItem = ({item}: {item: Notification}) => {
    const iconType = getIconType(item.title);
    const iconStyle = ICON_STYLES[iconType];

    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}>
        {!item.read && <View style={styles.unreadBar} />}
        <View style={[styles.iconWrap, {backgroundColor: iconStyle.bg}]}>
          <NotifIcon type={iconType} size={18} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
          </View>
          <Text style={styles.cardMsg} numberOfLines={2}>{item.body}</Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => handleDelete(item.id)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <Path d="M1 1L13 13M13 1L1 13" stroke="#C4C9D4" strokeWidth={2} strokeLinecap="round"/>
          </Svg>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({section}: {section: Section}) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{section.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
              <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#D1D5DB" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#D1D5DB" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptySub}>No notifications yet</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#E5383B']}
              tintColor="#E5383B"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // ── Header ──
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: '#E5383B',
    fontWeight: '500',
    marginTop: 2,
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
  },
  markAllText: {
    fontSize: 13,
    color: '#E5383B',
    fontWeight: '600',
  },

  // ── Section ──
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Card ──
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: '#FAFBFF',
    elevation: 2,
    shadowOpacity: 0.08,
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#E5383B',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    letterSpacing: -0.1,
  },
  cardTitleUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  cardMsg: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  cardTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    flexShrink: 0,
  },
  closeBtn: {
    marginLeft: 10,
    padding: 4,
    flexShrink: 0,
  },

  // ── Empty ──
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 8,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
  },
  emptySub: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
