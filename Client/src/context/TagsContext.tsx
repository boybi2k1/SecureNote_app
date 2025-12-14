import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Tag, CreateTagDto } from '../types/tag.types';
import { tagsService } from '../services/tagsService';

interface TagsContextType {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  createTag: (tag: CreateTagDto) => Promise<Tag>;
  deleteTag: (id: number) => Promise<void>;
  getTagById: (id: number) => Tag | undefined;
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export const TagsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tagsService.getTags();
      setTags(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể tải danh sách thẻ';
      setError(errorMessage);
      console.error('Fetch tags error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (tag: CreateTagDto): Promise<Tag> => {
    try {
      setError(null);
      // Server tự động return existing tag nếu name đã tồn tại
      const newTag = await tagsService.createTag(tag);
      
      // Kiểm tra xem tag đã tồn tại chưa
      const existingTag = tags.find((t) => t.name.toLowerCase() === tag.name.toLowerCase());
      if (!existingTag) {
        setTags((prev) => [...prev, newTag]);
      } else {
        // Cập nhật tag nếu đã tồn tại
        setTags((prev) => prev.map((t) => (t.id === existingTag.id ? newTag : t)));
      }
      
      return newTag;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể tạo thẻ';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteTag = async (id: number): Promise<void> => {
    try {
      setError(null);
      await tagsService.deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể xóa thẻ';
      setError(errorMessage);
      throw err;
    }
  };

  const getTagById = (id: number): Tag | undefined => {
    return tags.find((t) => t.id === id);
  };

  const value: TagsContextType = {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    deleteTag,
    getTagById,
  };

  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>;
};

export const useTags = (): TagsContextType => {
  const context = useContext(TagsContext);
  if (context === undefined) {
    throw new Error('useTags must be used within a TagsProvider');
  }
  return context;
};

