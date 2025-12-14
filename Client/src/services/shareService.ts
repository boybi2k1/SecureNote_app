import api from './api';
import { SharedNote, ShareRequest, UpdateSharePermissionRequest, UserSearchResult } from '../types/share.types';
import { Note } from '../types/note.types';

export const shareService = {
  async shareNote(noteId: number, shareRequest: ShareRequest): Promise<SharedNote> {
    const response = await api.post<SharedNote>(`/notes/${noteId}/share`, shareRequest);
    return response.data;
  },

  async unshareNote(noteId: number, recipientId: number): Promise<void> {
    await api.delete(`/notes/${noteId}/share/${recipientId}`);
  },

  async updateSharePermission(
    noteId: number,
    recipientId: number,
    permissionRequest: UpdateSharePermissionRequest
  ): Promise<SharedNote> {
    const response = await api.put<SharedNote>(
      `/notes/${noteId}/share/${recipientId}`,
      permissionRequest
    );
    return response.data;
  },

  async getSharedNotes(permission?: 'read' | 'write'): Promise<Note[]> {
    const params = new URLSearchParams();
    if (permission) {
      params.append('permission', permission);
    }
    const queryString = params.toString();
    
    // Backend routing issue: /notes/{note_id} matches before /notes/shared
    // Try multiple endpoint variations as workaround
    const endpoints = [
      queryString ? `/notes/shared?${queryString}` : '/notes/shared',
      queryString ? `/notes/shared/?${queryString}` : '/notes/shared/',
      queryString ? `/shared/notes?${queryString}` : '/shared/notes',
    ];
    
    let lastError: any;
    for (const url of endpoints) {
      try {
        const response = await api.get<Note[]>(url);
        return response.data;
      } catch (error: any) {
        lastError = error;
        // If it's a routing error (422 with int_parsing), try next endpoint
        const isRoutingError = error.response?.status === 422 && 
          error.response?.data?.detail?.some?.((d: any) => 
            d.type === 'int_parsing' && d.loc?.includes?.('note_id')
          );
        
        if (!isRoutingError) {
          // Not a routing error, throw immediately
          throw error;
        }
        // Continue to next endpoint if it's a routing error
      }
    }
    
    // If all endpoints failed with routing errors, throw with helpful message
    throw new Error(
      'Backend routing error: /notes/shared endpoint conflicts with /notes/{note_id}. ' +
      'Please fix backend routing by defining /notes/shared before /notes/{note_id}.'
    );
  },

  async getSharedByMe(): Promise<SharedNote[]> {
    const response = await api.get<SharedNote[]>('/notes/shared-by-me');
    return response.data;
  },

  async searchUsers(query: string): Promise<UserSearchResult[]> {
    if (query.length < 3) {
      return [];
    }
    const response = await api.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

