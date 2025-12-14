import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Todo,
  CreateTodoDto,
  UpdateTodoDto,
  TodoFilters,
  TodoItem,
  CreateTodoItemDto,
  UpdateTodoItemDto,
} from '../types/todo.types';
import { todosService } from '../services/todosService';
import { notificationService } from '../services/notificationService';

interface TodosContextType {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  fetchTodos: (filters?: TodoFilters) => Promise<void>;
  createTodo: (todo: CreateTodoDto) => Promise<Todo>;
  updateTodo: (id: number, todo: UpdateTodoDto) => Promise<Todo>;
  deleteTodo: (id: number) => Promise<void>;
  toggleComplete: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  getTodoById: (id: number) => Todo | undefined;
  refreshTodos: () => Promise<void>;
  restoreTodo: (id: number) => Promise<Todo>;
  permanentDeleteTodo: (id: number) => Promise<void>;
  // Todo Items
  createTodoItem: (todoId: number, item: CreateTodoItemDto) => Promise<TodoItem>;
  updateTodoItem: (todoId: number, itemId: number, item: UpdateTodoItemDto) => Promise<TodoItem>;
  deleteTodoItem: (todoId: number, itemId: number) => Promise<void>;
  toggleItemComplete: (todoId: number, itemId: number) => Promise<void>;
}

const TodosContext = createContext<TodosContextType | undefined>(undefined);

export const TodosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<TodoFilters | undefined>();

  const fetchTodos = async (filters?: TodoFilters) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentFilters(filters);
      const data = await todosService.getTodos(filters);
      // Normalize category
      const normalizedData = data.map((todo) => ({
        ...todo,
        category: todo.category_id === null ? null : todo.category,
      }));
      setTodos(normalizedData);

      // Re-schedule notifications for todos with reminders (only if not fetching deleted todos)
      if (!filters?.is_deleted) {
        for (const todo of normalizedData) {
          if (todo.reminder_at && !todo.is_completed) {
            const reminderDate = new Date(todo.reminder_at);
            if (reminderDate > new Date()) {
              await notificationService.scheduleNotification(
                todo.id,
                todo.title,
                reminderDate,
                todo.description
              );
            }
          }
        }
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || 'Không thể tải danh sách todo';
      setError(errorMessage);
      console.error('Fetch todos error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (todo: CreateTodoDto): Promise<Todo> => {
    try {
      setError(null);
      const newTodo = await todosService.createTodo(todo);
      // Normalize category
      const normalizedTodo = {
        ...newTodo,
        category: newTodo.category_id === null ? null : newTodo.category,
      };
      setTodos((prev) => [normalizedTodo, ...prev]);

      // Schedule notification if reminder_at is set
      if (newTodo.reminder_at && !newTodo.is_completed) {
        const reminderDate = new Date(newTodo.reminder_at);
        await notificationService.scheduleNotification(
          newTodo.id,
          newTodo.title,
          reminderDate,
          newTodo.description
        );
      }

      return normalizedTodo;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể tạo todo';
      setError(errorMessage);
      throw err;
    }
  };

  const updateTodo = async (id: number, todo: UpdateTodoDto): Promise<Todo> => {
    try {
      setError(null);
      const updatedTodo = await todosService.updateTodo(id, todo);
      // Normalize category
      const normalizedTodo = {
        ...updatedTodo,
        category: updatedTodo.category_id === null ? null : updatedTodo.category,
      };
      setTodos((prev) => prev.map((t) => (t.id === id ? normalizedTodo : t)));

      // Update notification
      if (updatedTodo.is_completed) {
        // Cancel notification if todo is completed
        await notificationService.cancelNotification(id);
      } else if (updatedTodo.reminder_at) {
        // Update notification if reminder_at is set
        const reminderDate = new Date(updatedTodo.reminder_at);
        await notificationService.updateNotification(
          id,
          updatedTodo.title,
          reminderDate,
          updatedTodo.description
        );
      } else {
        // Cancel notification if reminder_at is removed
        await notificationService.cancelNotification(id);
      }

      return normalizedTodo;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể cập nhật todo';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteTodo = async (id: number): Promise<void> => {
    try {
      setError(null);
      await todosService.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      // Cancel notification when todo is deleted
      await notificationService.cancelNotification(id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể xóa todo';
      setError(errorMessage);
      throw err;
    }
  };

  const toggleComplete = async (id: number): Promise<void> => {
    try {
      setError(null);
      const response = await todosService.toggleComplete(id);
      
      // Get current todo before updating state
      const currentTodo = todos.find((t) => t.id === id);
      
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, is_completed: response.is_completed, status: response.status as any }
            : t
        )
      );

      // Cancel notification if todo is completed
      if (response.is_completed) {
        await notificationService.cancelNotification(id);
      } else {
        // Re-schedule notification if todo is uncompleted and has reminder
        if (currentTodo && currentTodo.reminder_at) {
          const reminderDate = new Date(currentTodo.reminder_at);
          if (reminderDate > new Date()) {
            await notificationService.scheduleNotification(
              id,
              currentTodo.title,
              reminderDate,
              currentTodo.description
            );
          }
        }
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || 'Không thể cập nhật trạng thái';
      setError(errorMessage);
      throw err;
    }
  };

  const toggleFavorite = async (id: number): Promise<void> => {
    try {
      setError(null);
      const response = await todosService.toggleFavorite(id);
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_favorite: response.is_favorite } : t))
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || 'Không thể cập nhật yêu thích';
      setError(errorMessage);
      throw err;
    }
  };

  const getTodoById = (id: number): Todo | undefined => {
    return todos.find((t) => t.id === id);
  };

  const refreshTodos = async (): Promise<void> => {
    await fetchTodos(currentFilters);
  };

  const restoreTodo = async (id: number): Promise<Todo> => {
    try {
      setError(null);
      const restoredTodo = await todosService.restoreTodo(id);
      // Normalize category
      const normalizedTodo = {
        ...restoredTodo,
        category: restoredTodo.category_id === null ? null : restoredTodo.category,
      };
      // Xóa todo khỏi danh sách (vì nó không còn trong trash nữa)
      setTodos((prev) => prev.filter((t) => t.id !== id));
      return normalizedTodo;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể khôi phục todo';
      setError(errorMessage);
      throw err;
    }
  };

  const permanentDeleteTodo = async (id: number): Promise<void> => {
    try {
      setError(null);
      await todosService.permanentDeleteTodo(id);
      // Xóa todo khỏi danh sách
      setTodos((prev) => prev.filter((t) => t.id !== id));
      // Cancel notification
      await notificationService.cancelNotification(id);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || 'Không thể xóa vĩnh viễn todo';
      setError(errorMessage);
      throw err;
    }
  };

  // Todo Items
  const createTodoItem = async (todoId: number, item: CreateTodoItemDto): Promise<TodoItem> => {
    try {
      setError(null);
      const newItem = await todosService.createTodoItem(todoId, item);
      // Update todo in list to include new item
      setTodos((prev) =>
        prev.map((t) => {
          if (t.id === todoId) {
            return {
              ...t,
              subtasks: [...(t.subtasks || []), newItem],
            };
          }
          return t;
        })
      );
      return newItem;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || 'Không thể tạo subtask';
      setError(errorMessage);
      throw err;
    }
  };

  const updateTodoItem = async (
    todoId: number,
    itemId: number,
    item: UpdateTodoItemDto
  ): Promise<TodoItem> => {
    try {
      setError(null);
      const updatedItem = await todosService.updateTodoItem(todoId, itemId, item);
      // Update item in todo's subtasks
      setTodos((prev) =>
        prev.map((t) => {
          if (t.id === todoId) {
            return {
              ...t,
              subtasks: (t.subtasks || []).map((subtask) =>
                subtask.id === itemId ? updatedItem : subtask
              ),
            };
          }
          return t;
        })
      );
      return updatedItem;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || 'Không thể cập nhật subtask';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteTodoItem = async (todoId: number, itemId: number): Promise<void> => {
    try {
      setError(null);
      await todosService.deleteTodoItem(todoId, itemId);
      // Remove item from todo's subtasks
      setTodos((prev) =>
        prev.map((t) => {
          if (t.id === todoId) {
            return {
              ...t,
              subtasks: (t.subtasks || []).filter((subtask) => subtask.id !== itemId),
            };
          }
          return t;
        })
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || 'Không thể xóa subtask';
      setError(errorMessage);
      throw err;
    }
  };

  const toggleItemComplete = async (todoId: number, itemId: number): Promise<void> => {
    try {
      setError(null);
      const response = await todosService.toggleItemComplete(todoId, itemId);
      // Update item in todo's subtasks
      setTodos((prev) =>
        prev.map((t) => {
          if (t.id === todoId) {
            return {
              ...t,
              subtasks: (t.subtasks || []).map((subtask) =>
                subtask.id === itemId ? { ...subtask, is_completed: response.is_completed } : subtask
              ),
            };
          }
          return t;
        })
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || 'Không thể cập nhật trạng thái subtask';
      setError(errorMessage);
      throw err;
    }
  };

  const value: TodosContextType = {
    todos,
    loading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    toggleFavorite,
    getTodoById,
    refreshTodos,
    restoreTodo,
    permanentDeleteTodo,
    createTodoItem,
    updateTodoItem,
    deleteTodoItem,
    toggleItemComplete,
  };

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>;
};

export const useTodos = (): TodosContextType => {
  const context = useContext(TodosContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodosProvider');
  }
  return context;
};

