import { Category, Tag } from './category.types';

export interface TodoItem {
  id: number;
  todo_id: number;
  title: string;
  is_completed: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  reminder_at?: string;
  is_completed: boolean;
  completed_at?: string;
  category_id?: number;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  is_shared: boolean;
  linked_note_id?: number;
  // Recurrence fields
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  recurrence_count?: number;
  parent_todo_id?: number;
  next_occurrence_date?: string;
  is_recurring_template?: boolean;
  created_at: string;
  updated_at: string;
  tag_ids: number[];
  category?: Category | null;
  tags: Tag[];
  subtasks?: TodoItem[];
}

export interface CreateTodoDto {
  title: string; // 1-500 ký tự, bắt buộc
  description?: string; // Tối đa 10,000 ký tự, optional
  status?: 'pending' | 'in_progress' | 'completed'; // Optional, default: pending
  priority?: 'low' | 'medium' | 'high' | 'urgent'; // Optional, default: medium
  due_date?: string; // Optional
  reminder_at?: string; // Optional
  category_id?: number | null; // Optional
  tag_ids?: number[]; // Optional
  linked_note_id?: number | null; // Optional
  // Recurrence fields
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  recurrence_count?: number;
}

export interface UpdateTodoDto {
  title?: string; // Optional, 1-500 ký tự
  description?: string; // Optional, tối đa 10,000 ký tự
  status?: 'pending' | 'in_progress' | 'completed'; // Optional
  priority?: 'low' | 'medium' | 'high' | 'urgent'; // Optional
  due_date?: string; // Optional
  reminder_at?: string; // Optional
  category_id?: number | null; // Optional, 0 để xóa category
  tag_ids?: number[]; // Optional, [] để xóa tất cả tags
  linked_note_id?: number | null; // Optional, 0 để xóa link
  // Recurrence fields
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | null;
  recurrence_interval?: number;
  recurrence_end_date?: string | null;
  recurrence_count?: number;
}

export interface TodoFilters {
  category_id?: number;
  tag_ids?: number[];
  favorite?: boolean;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
  is_deleted?: boolean;
}

export interface CreateTodoItemDto {
  title: string; // 1-500 ký tự, bắt buộc
  order?: number; // Optional, default: 0
}

export interface UpdateTodoItemDto {
  title?: string; // Optional, 1-500 ký tự
  is_completed?: boolean; // Optional
  order?: number; // Optional
}

