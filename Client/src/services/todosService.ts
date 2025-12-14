import api from './api';
import {
  Todo,
  CreateTodoDto,
  UpdateTodoDto,
  TodoFilters,
  TodoItem,
  CreateTodoItemDto,
  UpdateTodoItemDto,
} from '../types/todo.types';

export const todosService = {
  /**
   * Generate recurring todo instances
   * Should be called when app opens or periodically
   */
  async generateRecurringInstances(): Promise<{ message: string; count: number }> {
    try {
      const response = await api.post('/todos/recurring/generate-instances');
      return response.data;
    } catch (error: any) {
      console.error('Error generating recurring instances:', error);
      throw error;
    }
  },
  async getTodos(filters?: TodoFilters): Promise<Todo[]> {
    const params = new URLSearchParams();

    if (filters?.category_id) {
      params.append('category_id', filters.category_id.toString());
    }

    if (filters?.tag_ids && filters.tag_ids.length > 0) {
      params.append('tag_ids', filters.tag_ids.join(','));
    }

    if (filters?.favorite !== undefined) {
      params.append('favorite', filters.favorite.toString());
    }

    if (filters?.status) {
      params.append('status_filter', filters.status);
    }

    if (filters?.priority) {
      params.append('priority', filters.priority);
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.is_deleted !== undefined) {
      params.append('is_deleted', filters.is_deleted.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/todos?${queryString}` : '/todos';

    const response = await api.get<Todo[]>(url);
    return response.data;
  },

  async getTodoById(id: number): Promise<Todo> {
    const response = await api.get<Todo>(`/todos/${id}`);
    return response.data;
  },

  async createTodo(todo: CreateTodoDto): Promise<Todo> {
    const response = await api.post<Todo>('/todos', todo);
    return response.data;
  },

  async updateTodo(id: number, todo: UpdateTodoDto): Promise<Todo> {
    const response = await api.put<Todo>(`/todos/${id}`, todo);
    return response.data;
  },

  async deleteTodo(id: number): Promise<void> {
    await api.delete(`/todos/${id}`);
  },

  async toggleComplete(todoId: number): Promise<{ is_completed: boolean; status: string }> {
    const response = await api.post<{ is_completed: boolean; status: string }>(
      `/todos/${todoId}/complete`
    );
    return response.data;
  },

  async toggleFavorite(todoId: number): Promise<{ is_favorite: boolean }> {
    const response = await api.post<{ is_favorite: boolean }>(`/todos/${todoId}/favorite`);
    return response.data;
  },

  async getTrashTodos(): Promise<Todo[]> {
    const response = await api.get<Todo[]>('/todos/trash');
    return response.data;
  },

  async restoreTodo(id: number): Promise<Todo> {
    const response = await api.post<Todo>(`/todos/${id}/restore`);
    return response.data;
  },

  async permanentDeleteTodo(id: number): Promise<void> {
    await api.delete(`/todos/${id}/permanent`);
  },

  // Todo Items (Subtasks)
  async getTodoItems(todoId: number): Promise<TodoItem[]> {
    const response = await api.get<TodoItem[]>(`/todos/${todoId}/items`);
    return response.data;
  },

  async createTodoItem(todoId: number, item: CreateTodoItemDto): Promise<TodoItem> {
    const response = await api.post<TodoItem>(`/todos/${todoId}/items`, item);
    return response.data;
  },

  async updateTodoItem(
    todoId: number,
    itemId: number,
    item: UpdateTodoItemDto
  ): Promise<TodoItem> {
    const response = await api.put<TodoItem>(`/todos/${todoId}/items/${itemId}`, item);
    return response.data;
  },

  async deleteTodoItem(todoId: number, itemId: number): Promise<void> {
    await api.delete(`/todos/${todoId}/items/${itemId}`);
  },

  async toggleItemComplete(
    todoId: number,
    itemId: number
  ): Promise<{ is_completed: boolean }> {
    const response = await api.post<{ is_completed: boolean }>(
      `/todos/${todoId}/items/${itemId}/complete`
    );
    return response.data;
  },
};

