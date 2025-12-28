export interface CalendarEvent {
  id: string;
  date: string;
  type: 'todo' | 'note';
  title: string;
  description?: string;
  linked_id: number;
  color: string;
  is_completed?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  category_color?: string;
}

export interface CalendarEventsResponse {
  start_date: string;
  end_date: string;
  events: CalendarEvent[];
  count: number;
}

export interface CalendarFilters {
  start_date?: string;
  end_date?: string;
  include_todos?: boolean;
  include_notes?: boolean;
}





