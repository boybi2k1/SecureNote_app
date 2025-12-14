import api from './api';

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
        
        const response = await api.post<OCRResponse>('/notes/ocr', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 120 giây (2 phút) cho OCR và tạo title
        });
        
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        // Nếu là lỗi network và còn retry, đợi một chút rồi thử lại
        if (
          attempt < retries &&
          (error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network') ||
           error.message?.includes('Stream Closed'))
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

