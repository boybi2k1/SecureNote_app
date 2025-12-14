export interface Tag {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

export interface CreateTagDto {
  name: string; // 1-50 ký tự, bắt buộc
}

