/**
 * Utility functions for handling dates and timezones
 * Ensures consistent date handling across the app
 */

/**
 * Convert a Date to ISO string with timezone offset
 * This ensures the server receives the exact local time the user selected
 */
export const toLocalISOString = (date: Date): string => {
  // Get timezone offset in minutes
  const offset = -date.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? '+' : '-';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Return with timezone offset (e.g., "2024-01-01T14:00:00+07:00")
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
};

/**
 * Parse a datetime string from server
 * Handles both ISO format with timezone and local format
 */
export const parseServerDateTime = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    // If string has timezone info (ends with Z or +XX:XX), parse normally
    if (dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
      return new Date(dateString);
    }
    
    // If string is in local format (YYYY-MM-DDTHH:mm:ss), treat as local time
    // This ensures the time the user selected is preserved
    const date = new Date(dateString);
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Format date for display in Vietnamese locale
 */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format relative time (e.g., "30 phút nữa", "2 giờ nữa")
 */
export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  const diff = dateObj.getTime() - now.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 0) return 'Đã qua';
  if (minutes < 60) return `${minutes} phút nữa`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours} giờ ${remainingMinutes} phút nữa` : `${hours} giờ nữa`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days} ngày ${remainingHours} giờ nữa` : `${days} ngày nữa`;
};

