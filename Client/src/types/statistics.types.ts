export interface Statistics {
  // Notes statistics
  total_notes: number;
  total_notes_this_week: number;
  total_notes_this_month: number;
  favorite_notes: number;
  shared_notes: number;
  
  // Todos statistics
  total_todos: number;
  completed_todos: number;
  pending_todos: number;
  in_progress_todos: number;
  completion_rate: number;
  total_todos_this_week: number;
  total_todos_this_month: number;
  completed_todos_this_week: number;
  completed_todos_this_month: number;
  
  // Priority distribution
  todos_by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  
  // Category distribution
  notes_by_category: Record<string, number>;
  todos_by_category: Record<string, number>;
  
  // Activity over time
  notes_created_last_7_days: Array<{
    date: string;
    count: number;
  }>;
  todos_completed_last_7_days: Array<{
    date: string;
    count: number;
  }>;
  
  // Recent activity
  recent_notes_count: number;
  recent_todos_count: number;
}



