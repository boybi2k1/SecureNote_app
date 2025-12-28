import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../Notes/NotesListScreen';
import { calendarService } from '../../services/calendarService';
import { CalendarEvent, CalendarEventsResponse } from '../../types/calendar.types';
import { parseServerDateTime } from '../../utils/dateUtils';

type CalendarScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Calendar'>;

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [markedDates, setMarkedDates] = useState<any>({});

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    updateMarkedDates();
  }, [events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const response: CalendarEventsResponse = await calendarService.getEvents({
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0],
        include_todos: true,
        include_notes: false,
      });

      setEvents(response.events);
    } catch (error: any) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMarkedDates = () => {
    const marked: any = {};

    events.forEach((event) => {
      if (!event.date) return;
      const dateStr = event.date.split('T')[0];
      
      if (!marked[dateStr]) {
        marked[dateStr] = {
          marked: true,
          dots: [],
          selected: dateStr === selectedDate,
        };
      }

      marked[dateStr].dots.push({
        key: event.id,
        color: event.color,
        selectedDotColor: event.color,
      });
    });

    // Mark selected date
    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = { selected: true, selectedColor: '#2196F3' };
    } else if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#2196F3';
    }

    setMarkedDates(marked);
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const getEventsForDate = (date: string): CalendarEvent[] => {
    return events.filter((event) => {
      if (!event.date) return false;
      const eventDate = event.date.split('T')[0];
      return eventDate === date;
    });
  };

  const handleEventPress = (event: CalendarEvent) => {
    if (event.type === 'todo') {
      navigation.navigate('TodoDetail', { todoId: event.linked_id });
    } else if (event.type === 'note') {
      navigation.navigate('NoteDetail', { noteId: event.linked_id });
    }
  };

  const formatTime = (dateString: string): string => {
    const date = parseServerDateTime(dateString);
    if (!date) return '';
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#2196F3',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#2196F3',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#00adf5',
          selectedDotColor: '#ffffff',
          arrowColor: '#2196F3',
          monthTextColor: '#2d4150',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}
        style={styles.calendar}
      />

      <ScrollView
        style={styles.eventsContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadEvents} />
        }
      >
        <View style={styles.selectedDateHeader}>
          <Text style={styles.selectedDateText}>
            {parseServerDateTime(selectedDate + 'T00:00:00')?.toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.eventsCount}>
            {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'sự kiện' : 'sự kiện'}
          </Text>
        </View>

        {loading && selectedDateEvents.length === 0 ? (
          <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
        ) : selectedDateEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có sự kiện nào trong ngày này</Text>
          </View>
        ) : (
          selectedDateEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, { borderLeftColor: event.color }]}
              onPress={() => handleEventPress(event)}
            >
              <View style={styles.eventHeader}>
                <View style={[styles.eventColorDot, { backgroundColor: event.color }]} />
                <Text style={styles.eventTitle}>{event.title}</Text>
              </View>
              {event.description && (
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
                </Text>
              )}
              <View style={styles.eventFooter}>
                <Text style={styles.eventTime}>{formatTime(event.date)}</Text>
                {event.type === 'todo' && (
                  <View style={styles.eventBadges}>
                    {event.is_completed && (
                      <View style={[styles.badge, styles.completedBadge]}>
                        <Text style={styles.badgeText}>Hoàn thành</Text>
                      </View>
                    )}
                    {event.priority && (
                      <View style={[styles.badge, { backgroundColor: event.color }]}>
                        <Text style={styles.badgeText}>
                          {event.priority === 'urgent'
                            ? 'Khẩn'
                            : event.priority === 'high'
                            ? 'Cao'
                            : event.priority === 'medium'
                            ? 'Trung bình'
                            : 'Thấp'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
  },
  eventsContainer: {
    flex: 1,
    padding: 16,
  },
  selectedDateHeader: {
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventsCount: {
    fontSize: 14,
    color: '#666',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 12,
    color: '#999',
  },
  eventBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
});





