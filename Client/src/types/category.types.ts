export interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string; // Hex color code (#RRGGBB)
  created_at: string;
}

export interface CreateCategoryDto {
  name: string; // 1-100 ký tự, bắt buộc
  color?: string; // Optional, hex color code, default: "#3498db"
}

export interface UpdateCategoryDto {
  name?: string; // Optional, 1-100 ký tự
  color?: string; // Optional, hex color code
}

