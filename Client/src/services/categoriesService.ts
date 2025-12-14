import api from './api';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/category.types';

export const categoriesService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  async createCategory(category: CreateCategoryDto): Promise<Category> {
    const response = await api.post<Category>('/categories', category);
    return response.data;
  },

  async updateCategory(id: number, category: UpdateCategoryDto): Promise<Category> {
    const response = await api.put<Category>(`/categories/${id}`, category);
    return response.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};

