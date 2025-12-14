import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Note, CreateNoteDto, UpdateNoteDto, NoteFilters } from '../types/note.types';
import { notesService } from '../services/notesService';

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  error: string | null;
  fetchNotes: (filters?: NoteFilters) => Promise<void>;
  createNote: (note: CreateNoteDto) => Promise<Note>;
  updateNote: (id: number, note: UpdateNoteDto) => Promise<Note>;
  deleteNote: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  getNoteById: (id: number) => Note | undefined;
  refreshNotes: () => Promise<void>;
  restoreNote: (id: number) => Promise<Note>;
  permanentDeleteNote: (id: number) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<NoteFilters | undefined>();

  const fetchNotes = async (filters?: NoteFilters) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentFilters(filters);
      const data = await notesService.getNotes(filters);
      // Đảm bảo nếu category_id là null thì category cũng phải là null
      const normalizedData = data.map((note) => ({
        ...note,
        category: note.category_id === null ? null : note.category,
      }));
      setNotes(normalizedData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể tải danh sách ghi chú';
      setError(errorMessage);
      console.error('Fetch notes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (note: CreateNoteDto): Promise<Note> => {
    try {
      setError(null);
      const newNote = await notesService.createNote(note);
      // Normalize category
      const normalizedNote = {
        ...newNote,
        category: newNote.category_id === null ? null : newNote.category,
      };
      setNotes((prev) => [normalizedNote, ...prev]);
      return normalizedNote;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể tạo ghi chú';
      setError(errorMessage);
      throw err;
    }
  };

  const updateNote = async (id: number, note: UpdateNoteDto): Promise<Note> => {
    try {
      setError(null);
      const updatedNote = await notesService.updateNote(id, note);
      // Normalize category
      const normalizedNote = {
        ...updatedNote,
        category: updatedNote.category_id === null ? null : updatedNote.category,
      };
      setNotes((prev) => prev.map((n) => (n.id === id ? normalizedNote : n)));
      return normalizedNote;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể cập nhật ghi chú';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteNote = async (id: number): Promise<void> => {
    try {
      setError(null);
      await notesService.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể xóa ghi chú';
      setError(errorMessage);
      throw err;
    }
  };

  const toggleFavorite = async (id: number): Promise<void> => {
    try {
      setError(null);
      const response = await notesService.toggleFavorite(id);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_favorite: response.is_favorite } : n))
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể cập nhật yêu thích';
      setError(errorMessage);
      throw err;
    }
  };

  const getNoteById = (id: number): Note | undefined => {
    return notes.find((n) => n.id === id);
  };

  const refreshNotes = async (): Promise<void> => {
    await fetchNotes(currentFilters);
  };

  const restoreNote = async (id: number): Promise<Note> => {
    try {
      setError(null);
      const restoredNote = await notesService.restoreNote(id);
      // Normalize category
      const normalizedNote = {
        ...restoredNote,
        category: restoredNote.category_id === null ? null : restoredNote.category,
      };
      // Xóa note khỏi danh sách (vì nó không còn trong trash nữa)
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return normalizedNote;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể khôi phục ghi chú';
      setError(errorMessage);
      throw err;
    }
  };

  const permanentDeleteNote = async (id: number): Promise<void> => {
    try {
      setError(null);
      await notesService.permanentDeleteNote(id);
      // Xóa note khỏi danh sách
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể xóa vĩnh viễn ghi chú';
      setError(errorMessage);
      throw err;
    }
  };

  const value: NotesContextType = {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    getNoteById,
    refreshNotes,
    restoreNote,
    permanentDeleteNote,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};

export const useNotes = (): NotesContextType => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

