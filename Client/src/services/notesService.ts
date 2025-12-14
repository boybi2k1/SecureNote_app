import api from './api';
import { Note, CreateNoteDto, UpdateNoteDto, NoteFilters } from '../types/note.types';

export const notesService = {
  async getNotes(filters?: NoteFilters): Promise<Note[]> {
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
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    
    if (filters?.is_deleted !== undefined) {
      params.append('is_deleted', filters.is_deleted.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/notes?${queryString}` : '/notes';
    
    const response = await api.get<Note[]>(url);
    return response.data;
  },

  async getNoteById(id: number): Promise<Note> {
    const response = await api.get<Note>(`/notes/${id}`);
    return response.data;
  },

  async createNote(note: CreateNoteDto): Promise<Note> {
    const response = await api.post<Note>('/notes', note);
    return response.data;
  },

  async updateNote(id: number, note: UpdateNoteDto): Promise<Note> {
    const response = await api.put<Note>(`/notes/${id}`, note);
    return response.data;
  },

  async deleteNote(id: number): Promise<void> {
    await api.delete(`/notes/${id}`);
  },

  async toggleFavorite(noteId: number): Promise<{ is_favorite: boolean }> {
    const response = await api.post<{ is_favorite: boolean }>(`/notes/${noteId}/favorite`);
    return response.data;
  },

  async getTrashNotes(): Promise<Note[]> {
    const response = await api.get<Note[]>('/notes/trash');
    return response.data;
  },

  async restoreNote(id: number): Promise<Note> {
    const response = await api.post<Note>(`/notes/${id}/restore`);
    return response.data;
  },

  async permanentDeleteNote(id: number): Promise<void> {
    await api.delete(`/notes/${id}/permanent`);
  },
};

