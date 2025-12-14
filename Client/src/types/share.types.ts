export type Permission = 'read' | 'write';

export interface SharedNote {
  id: number;
  original_note_id: number;
  shared_note_id: number;
  owner_id: number;
  recipient_id: number;
  permission: Permission;
  shared_at: string;
}

export interface ShareRequest {
  recipient_username: string; // 3-50 ký tự, bắt buộc
  permission?: Permission; // "read" hoặc "write", optional, default: "read"
}

export interface UpdateSharePermissionRequest {
  permission: Permission; // "read" hoặc "write", bắt buộc
}

export interface UserSearchResult {
  username: string;
}

