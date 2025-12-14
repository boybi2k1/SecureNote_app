import { todosService } from './todosService';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { parseServerDateTime } from '../utils/dateUtils';

/**
 * Service to check for due reminders and show notifications/alerts
 * This works even in Expo Go by checking when app is open
 */
class ReminderCheckerService {
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: Date = new Date();
  private checkedTodoIds: Set<number> = new Set();
  private navigationRef: any = null;

  /**
   * Set navigation ref for navigating to todo detail
   */
  setNavigationRef(ref: any): void {
    this.navigationRef = ref;
  }

  /**
   * Start checking for reminders periodically
   * For Expo Go, check more frequently (every 30 seconds) since we can't use background notifications
   */
  startChecking(intervalSeconds: number = 30): void {
    // Clear existing interval if any
    this.stopChecking();

    // Check immediately
    this.checkReminders();

    // Then check periodically (every 30 seconds for Expo Go)
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, intervalSeconds * 1000);
  }

  /**
   * Stop checking for reminders
   */
  stopChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check for reminders that are due
   */
  async checkReminders(): Promise<void> {
    try {
      // Get all active todos
      const todos = await todosService.getTodos({
        is_deleted: false,
      });

      const now = new Date();
      const currentTime = now.getTime();

      for (const todo of todos) {
        // Skip if already checked or completed
        if (todo.is_completed || !todo.reminder_at) {
          continue;
        }

        const reminderDate = parseServerDateTime(todo.reminder_at);
        if (!reminderDate) continue;
        
        const reminderTime = reminderDate.getTime();
        const timeDiff = reminderTime - currentTime;

        // Check if reminder is due (within last 10 minutes to catch reminders even if app was closed)
        // This helps in Expo Go where we can't have background notifications
        if (timeDiff <= 0 && timeDiff >= -10 * 60 * 1000) {
          // Only show if not already checked
          const reminderKey = `${todo.id}-${Math.floor(reminderTime / 60000)}`;
          if (!this.checkedTodoIds.has(todo.id)) {
            this.checkedTodoIds.add(todo.id);
            this.showReminderAlert(todo);
          }
        }
      }

      // Clean up old checked IDs (older than 1 hour)
      const oneHourAgo = currentTime - 60 * 60 * 1000;
      this.checkedTodoIds.forEach((todoId) => {
        // Simple cleanup - remove IDs checked more than 1 hour ago
        // In a real implementation, you'd track timestamps
      });
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  /**
   * Show reminder alert to user
   */
  private showReminderAlert(todo: any): void {
    const title = `📋 Nhắc nhở: ${todo.title}`;
    const reminderDate = parseServerDateTime(todo.reminder_at);
    if (!reminderDate) return;
    
    const timeStr = reminderDate.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const message = todo.description 
      ? `${todo.description}\n\n⏰ Thời gian: ${timeStr}`
      : `Đã đến thời gian nhắc nhở!\n\n⏰ Thời gian: ${timeStr}`;

    // Show Alert (works in Expo Go)
    // This is the primary notification method for Expo Go
    Alert.alert(title, message, [
      {
        text: 'Xem ngay',
        onPress: () => {
          // Navigate to todo detail if navigation is available
          if (this.navigationRef && this.navigationRef.isReady()) {
            this.navigationRef.navigate('TodoDetail', { todoId: todo.id });
          }
        },
        style: 'default',
      },
      {
        text: 'Đóng',
        style: 'cancel',
      },
    ]);
  }

  /**
   * Get upcoming reminders (for display in UI)
   */
  async getUpcomingReminders(hoursAhead: number = 24): Promise<any[]> {
    try {
      const todos = await todosService.getTodos({
        is_deleted: false,
      });

      const now = new Date();
      const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
      const upcoming: any[] = [];

      for (const todo of todos) {
        if (todo.is_completed || !todo.reminder_at) {
          continue;
        }

        const reminderDate = parseServerDateTime(todo.reminder_at);
        if (!reminderDate) continue;
        
        if (reminderDate >= now && reminderDate <= futureTime) {
          upcoming.push({
            ...todo,
            reminderTime: reminderDate,
            minutesUntil: Math.floor((reminderDate.getTime() - now.getTime()) / 60000),
          });
        }
      }

      // Sort by reminder time
      return upcoming.sort((a, b) => a.reminderTime.getTime() - b.reminderTime.getTime());
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      return [];
    }
  }

  /**
   * Clear checked reminders (call when app starts)
   */
  clearCheckedReminders(): void {
    this.checkedTodoIds.clear();
  }
}

export const reminderCheckerService = new ReminderCheckerService();

