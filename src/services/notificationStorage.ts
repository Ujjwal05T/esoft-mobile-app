import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = '@notifications';
const UNREAD_COUNT_KEY = '@unread_notifications_count';

export interface Notification {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  data?: {
    screen?: string;
    params?: any;
    [key: string]: any;
  };
  timestamp: number;
  read: boolean;
}

// Get all notifications
export async function getNotifications(): Promise<Notification[]> {
  try {
    const notificationsJson = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (notificationsJson) {
      const notifications = JSON.parse(notificationsJson);
      // Sort by timestamp descending (newest first)
      return notifications.sort((a: Notification, b: Notification) => b.timestamp - a.timestamp);
    }
    return [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

// Save a new notification
export async function saveNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<void> {
  try {
    const notifications = await getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
    };

    notifications.unshift(newNotification);

    // Keep only last 50 notifications
    const trimmedNotifications = notifications.slice(0, 50);

    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmedNotifications));
    await updateUnreadCount();
  } catch (error) {
    console.error('Error saving notification:', error);
  }
}

// Mark notification as read
export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const notifications = await getNotifications();
    const updatedNotifications = notifications.map(n =>
      n.id === id ? {...n, read: true} : n
    );
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
    await updateUnreadCount();
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const notifications = await getNotifications();
    const updatedNotifications = notifications.map(n => ({...n, read: true}));
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
    await updateUnreadCount();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Delete a notification
export async function deleteNotification(id: string): Promise<void> {
  try {
    const notifications = await getNotifications();
    const filteredNotifications = notifications.filter(n => n.id !== id);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filteredNotifications));
    await updateUnreadCount();
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

// Clear all notifications
export async function clearAllNotifications(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
    await AsyncStorage.setItem(UNREAD_COUNT_KEY, '0');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

// Get unread count
export async function getUnreadCount(): Promise<number> {
  try {
    const notifications = await getNotifications();
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Update unread count (helper function)
async function updateUnreadCount(): Promise<void> {
  try {
    const count = await getUnreadCount();
    await AsyncStorage.setItem(UNREAD_COUNT_KEY, count.toString());
  } catch (error) {
    console.error('Error updating unread count:', error);
  }
}

// Subscribe to unread count changes
export function subscribeToUnreadCount(callback: (count: number) => void): () => void {
  let interval: NodeJS.Timeout;

  const checkCount = async () => {
    const count = await getUnreadCount();
    callback(count);
  };

  checkCount(); // Initial check
  interval = setInterval(checkCount, 2000); // Check every 2 seconds

  return () => clearInterval(interval);
}
