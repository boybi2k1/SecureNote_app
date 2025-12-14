import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../screens/Notes/NotesListScreen';
import { reminderCheckerService } from '../services/reminderChecker';
import { Todo } from '../types/todo.types';

type UpcomingRemindersNavigationProp = StackNavigationProp<AppStackParamList>;

interface UpcomingReminder {
  id: number;
  title: string;
  reminderTime: Date;
  minutesUntil: number;
}

export const UpcomingReminders: React.FC = () => {
  const navigation = useNavigation<UpcomingRemindersNavigationProp>();
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUpcomingReminders();
    // Refresh every minute
    const interval = setInterval(loadUpcomingReminders, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadUpcomingReminders = async () => {
    try {
      setLoading(true);
      const reminders = await reminderCheckerService.getUpcomingReminders(24);
      setUpcomingReminders(
        reminders.slice(0, 5).map((r) => ({
          id: r.id,
          title: r.title,
          reminderTime: r.reminderTime,
          minutesUntil: r.minutesUntil,
        }))
      );
    } catch (error) {
      console.error('Error loading upcoming reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeUntil = (minutes: number): string => {
    if (minutes < 0) return 'Đã qua';
    if (minutes < 60) return `${minutes} phút nữa`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) {
      return mins > 0 ? `${hours} giờ ${mins} phút nữa` : `${hours} giờ nữa`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days} ngày ${remainingHours} giờ nữa` : `${days} ngày nữa`;
  };

  if (upcomingReminders.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⏰ Nhắc nhở sắp đến</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {upcomingReminders.map((reminder) => (
          <TouchableOpacity
            key={reminder.id}
            style={styles.reminderCard}
            onPress={() => navigation.navigate('TodoDetail', { todoId: reminder.id })}
          >
            <Text style={styles.reminderTitle} numberOfLines={1}>
              {reminder.title}
            </Text>
            <Text style={styles.reminderTime}>{formatTimeUntil(reminder.minutesUntil)}</Text>
            <Text style={styles.reminderDateTime}>
              {reminder.reminderTime.toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  scrollView: {
    flexDirection: 'row',
  },
  reminderCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#ffc107',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff9800',
    marginBottom: 2,
  },
  reminderDateTime: {
    fontSize: 11,
    color: '#666',
  },
});

