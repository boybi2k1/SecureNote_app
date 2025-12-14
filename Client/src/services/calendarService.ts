import api from './api';
import { CalendarEventsResponse, CalendarFilters } from '../types/calendar.types';

export const calendarService = {
  /**
   * Get calendar events for a date range
   */
  async getEvents(filters?: CalendarFilters): Promise<CalendarEventsResponse> {
    try {
      const params: any = {};
      
      if (filters?.start_date) params.start_date = filters.start_date;
      if (filters?.end_date) params.end_date = filters.end_date;
      if (filters?.include_todos !== undefined) params.include_todos = filters.include_todos;
      if (filters?.include_notes !== undefined) params.include_notes = filters.include_notes;

      const response = await api.get('/calendar/events', { params });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  },
};

