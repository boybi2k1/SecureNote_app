export const validation = {
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Mật khẩu phải có ít nhất 8 ký tự' };
    }
    if (password.length > 100) {
      return { valid: false, message: 'Mật khẩu không được vượt quá 100 ký tự' };
    }
    return { valid: true };
  },

  validateUsername(username: string): { valid: boolean; message?: string } {
    if (username.length < 3) {
      return { valid: false, message: 'Tên người dùng phải có ít nhất 3 ký tự' };
    }
    if (username.length > 50) {
      return { valid: false, message: 'Tên người dùng không được vượt quá 50 ký tự' };
    }
    return { valid: true };
  },

  validateNoteTitle(title: string): { valid: boolean; message?: string } {
    if (title.length < 1) {
      return { valid: false, message: 'Tiêu đề không được để trống' };
    }
    if (title.length > 500) {
      return { valid: false, message: 'Tiêu đề không được vượt quá 500 ký tự' };
    }
    return { valid: true };
  },

  validateNoteContent(content: string): { valid: boolean; message?: string } {
    if (content.length > 100000) {
      return { valid: false, message: 'Nội dung không được vượt quá 100,000 ký tự' };
    }
    return { valid: true };
  },

  validateCategoryColor(color: string): boolean {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(color);
  },
};

