import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
// Note: This may not work fully in Expo Go, but won't crash the app
let notificationHandlerSet = false;
try {
  if (typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        // Return proper notification response
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });
    notificationHandlerSet = true;
  }
} catch (error) {
  // Silently fail - this is expected in Expo Go
  notificationHandlerSet = false;
}

export interface NotificationData {
  todoId: number;
  title: string;
  body?: string;
}

class NotificationService {
  private scheduledNotifications: Map<number, string> = new Map(); // todoId -> notificationId

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Check if Notifications API is available (may not be in Expo Go)
      if (!Notifications.getPermissionsAsync || !Notifications.requestPermissionsAsync) {
        console.warn('Notifications API not available (likely in Expo Go)');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        } catch (error) {
          // Silently fail - expected in Expo Go
        }
      }

      return true;
    } catch (error) {
      // Silently fail - notifications not available in Expo Go
      return false;
    }
  }

  /**
   * Schedule a notification for a todo
   */
  async scheduleNotification(
    todoId: number,
    title: string,
    reminderAt: Date,
    body?: string
  ): Promise<string | null> {
    try {
      // Check if Notifications API is available
      if (!Notifications.scheduleNotificationAsync) {
        // Not available in Expo Go - silently fail
        return null;
      }

      // Cancel existing notification for this todo if any
      await this.cancelNotification(todoId);

      // Check if reminder is in the past
      if (reminderAt <= new Date()) {
        console.warn('Reminder time is in the past, skipping notification');
        return null;
      }

      // Calculate seconds until reminder
      const secondsUntilReminder = Math.floor((reminderAt.getTime() - Date.now()) / 1000);
      if (secondsUntilReminder <= 0) {
        console.warn('Reminder time is in the past, skipping notification');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📋 ${title}`,
          body: body || 'Đã đến thời gian nhắc nhở!',
          data: { todoId } as NotificationData,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilReminder,
        },
      });

      this.scheduledNotifications.set(todoId, notificationId);
      console.log(`Scheduled notification for todo ${todoId} at ${reminderAt}`);
      return notificationId;
    } catch (error) {
      // Silently fail - notifications not available in Expo Go
      return null;
    }
  }

  /**
   * Cancel a scheduled notification for a todo
   */
  async cancelNotification(todoId: number): Promise<void> {
    try {
      const notificationId = this.scheduledNotifications.get(todoId);
      if (notificationId && Notifications.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
      // Always remove from map
      this.scheduledNotifications.delete(todoId);
    } catch (error) {
      // Silently fail - just remove from map
      this.scheduledNotifications.delete(todoId);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      if (Notifications.cancelAllScheduledNotificationsAsync) {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      this.scheduledNotifications.clear();
    } catch (error) {
      // Silently fail - just clear map
      this.scheduledNotifications.clear();
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      if (Notifications.getAllScheduledNotificationsAsync) {
        return await Notifications.getAllScheduledNotificationsAsync();
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Update notification for a todo
   */
  async updateNotification(
    todoId: number,
    title: string,
    reminderAt: Date | null,
    body?: string
  ): Promise<string | null> {
    if (!reminderAt) {
      await this.cancelNotification(todoId);
      return null;
    }

    return await this.scheduleNotification(todoId, title, reminderAt, body);
  }
}

export const notificationService = new NotificationService();
