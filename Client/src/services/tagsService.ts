import api from './api';
import { Tag, CreateTagDto } from '../types/tag.types';

export const tagsService = {
  async getTags(): Promise<Tag[]> {
    const response = await api.get<Tag[]>('/tags');
    return response.data;
  },

  async createTag(tag: CreateTagDto): Promise<Tag> {
    const response = await api.post<Tag>('/tags', tag);
    return response.data;
  },

  async deleteTag(id: number): Promise<void> {
    await api.delete(`/tags/${id}`);
  },

  async addTagsToNote(noteId: number, tagIds: number[]): Promise<void> {
    await api.post(`/tags/notes/${noteId}/tags`, { tag_ids: tagIds });
  },

  async removeTagFromNote(noteId: number, tagId: number): Promise<void> {
    await api.delete(`/tags/notes/${noteId}/tags/${tagId}`);
  },
};

