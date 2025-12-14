import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/category.types';
import { categoriesService } from '../services/categoriesService';

interface CategoriesContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (category: CreateCategoryDto) => Promise<Category>;
  updateCategory: (id: number, category: UpdateCategoryDto) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  getCategoryById: (id: number) => Category | undefined;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const CategoriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesService.getCategories();
      setCategories(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể tải danh sách danh mục';
      setError(errorMessage);
      console.error('Fetch categories error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (category: CreateCategoryDto): Promise<Category> => {
    try {
      setError(null);
      const newCategory = await categoriesService.createCategory(category);
      setCategories((prev) => [...prev, newCategory]);
      return newCategory;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể tạo danh mục';
      setError(errorMessage);
      throw err;
    }
  };

  const updateCategory = async (id: number, category: UpdateCategoryDto): Promise<Category> => {
    try {
      setError(null);
      const updatedCategory = await categoriesService.updateCategory(id, category);
      setCategories((prev) => prev.map((c) => (c.id === id ? updatedCategory : c)));
      return updatedCategory;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể cập nhật danh mục';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteCategory = async (id: number): Promise<void> => {
    try {
      setError(null);
      await categoriesService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể xóa danh mục';
      setError(errorMessage);
      throw err;
    }
  };

  const getCategoryById = (id: number): Category | undefined => {
    return categories.find((c) => c.id === id);
  };

  const value: CategoriesContextType = {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
};

export const useCategories = (): CategoriesContextType => {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};

