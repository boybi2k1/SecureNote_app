import { API_BASE_URL } from '../utils/constants';
import { storageService } from './storageService';

export interface OCRResponse {
  title: string;
  content: string;
  success: boolean;
}

export const ocrService = {
  async extractTextFromImage(imageUri: string, retries: number = 2): Promise<OCRResponse> {
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Lấy token để authenticate
        const tokens = await storageService.getTokens();
        if (!tokens?.accessToken) {
          throw new Error('Không có token xác thực');
        }
        
        const formData = new FormData();
        
        // Tạo file object từ URI
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('file', {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);
        
        // Sử dụng fetch API thay vì axios để xử lý FormData tốt hơn trong React Native
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 giây timeout
        
        try {
          const response = await fetch(`${API_BASE_URL}/notes/ocr`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`,
              // Không set Content-Type, để fetch tự động set với boundary
            },
            body: formData,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Lỗi không xác định' }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
          }
          
          const data: OCRResponse = await response.json();
          return data;
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error: any) {
        lastError = error;
        
        // Nếu là lỗi network và còn retry, đợi một chút rồi thử lại
        if (
          attempt < retries &&
          (error.name === 'AbortError' ||
           error.message?.includes('Network') ||
           error.message?.includes('Stream Closed') ||
           error.message?.includes('Failed to fetch'))
        ) {
          console.log(`OCR attempt ${attempt + 1} failed, retrying...`);
          // Đợi 1 giây trước khi retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        
        // Nếu không phải network error hoặc đã hết retry, throw error
        throw error;
      }
    }
    
    // Nếu đến đây thì đã hết retry
    throw lastError;
  },
};

