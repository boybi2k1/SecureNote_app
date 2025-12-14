export interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  category_id: number | null;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  is_shared: boolean;
  original_note_id: number | null;
  created_at: string;
  updated_at: string;
  tag_ids: number[];
  category: Category | null;
  tags: Tag[];
}

export interface CreateNoteDto {
  title: string; // 1-500 ký tự, bắt buộc
  content: string; // Tối đa 100,000 ký tự, bắt buộc
  category_id?: number | null; // Optional
  tag_ids?: number[]; // Optional
}

export interface UpdateNoteDto {
  title?: string; // Optional, 1-500 ký tự
  content?: string; // Optional, tối đa 100,000 ký tự
  category_id?: number | null; // Optional, 0 để xóa category
  tag_ids?: number[]; // Optional, [] để xóa tất cả tags
}

export interface NoteFilters {
  category_id?: number;
  tag_ids?: number[];
  favorite?: boolean;
  search?: string;
  is_deleted?: boolean;
}

