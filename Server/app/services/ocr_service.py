import google.generativeai as genai
from PIL import Image
import io
from app.config import settings

# Cấu hình Gemini API
if not settings.GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY chưa được cấu hình trong .env file")

genai.configure(api_key=settings.GEMINI_API_KEY)


async def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Sử dụng Gemini Vision API để OCR text từ ảnh
    """
    try:
        # Kiểm tra API key
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY chưa được cấu hình trong .env file")
        
        # Khởi tạo model - sử dụng Gemini 2.5 Flash-Lite
        # Thử gemini-2.5-flash-lite trước, nếu không có thì thử gemini-2.0-flash-exp
        try:
            model = genai.GenerativeModel('gemini-2.5-flash-lite')
        except Exception as e:
            # Fallback sang model khác nếu gemini-2.5-flash-lite không tồn tại
            try:
                model = genai.GenerativeModel('gemini-2.0-flash-exp')
            except Exception:
                # Nếu cả hai đều không hoạt động, thử gemini-1.5-flash
                try:
                    model = genai.GenerativeModel('gemini-1.5-flash')
                except Exception as fallback_error:
                    raise Exception(f"Không thể khởi tạo model. Đã thử: gemini-2.5-flash-lite, gemini-2.0-flash-exp, gemini-1.5-flash. Lỗi: {str(e)}")
        
        # Convert bytes to PIL Image
        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as img_error:
            raise Exception(f"Không thể đọc file ảnh: {str(img_error)}")
        
        # Gọi API với prompt cho OCR
        prompt = """
        Hãy đọc và trích xuất tất cả text trong ảnh này. 
        Giữ nguyên định dạng và xuống dòng như trong ảnh.
        Chỉ trả về text, không thêm giải thích hay comment.
        Nếu không có text, trả về "Không tìm thấy text trong ảnh."
        """
        
        try:
            response = model.generate_content([prompt, image])
            
            # Kiểm tra response
            if not response or not hasattr(response, 'text'):
                raise Exception("Gemini API không trả về text")
            
            extracted_text = response.text.strip()
            return extracted_text if extracted_text else "Không tìm thấy text trong ảnh."
        except Exception as api_error:
            error_msg = str(api_error)
            if "API key" in error_msg or "authentication" in error_msg.lower():
                raise Exception(f"Lỗi xác thực Gemini API. Vui lòng kiểm tra GEMINI_API_KEY trong .env file: {error_msg}")
            raise Exception(f"Lỗi khi gọi Gemini API: {error_msg}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()  # Log full traceback
        raise Exception(f"Lỗi khi OCR ảnh: {str(e)}")


async def generate_title_from_content(content: str) -> str:
    """
    Sử dụng AI để tạo tiêu đề hợp lý từ nội dung
    """
    try:
        # Kiểm tra API key
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY chưa được cấu hình trong .env file")
        
        # Khởi tạo model
        try:
            model = genai.GenerativeModel('gemini-2.5-flash-lite')
        except Exception as e:
            try:
                model = genai.GenerativeModel('gemini-2.0-flash-exp')
            except Exception:
                try:
                    model = genai.GenerativeModel('gemini-1.5-flash')
                except Exception as fallback_error:
                    raise Exception(f"Không thể khởi tạo model. Lỗi: {str(e)}")
        
        # Prompt để tạo tiêu đề
        prompt = f"""
        Bạn là một trợ lý tạo tiêu đề thông minh. Nhiệm vụ của bạn là tạo một tiêu đề ngắn gọn từ nội dung được cung cấp.
        
        QUAN TRỌNG: Tiêu đề PHẢI được viết bằng CÙNG NGÔN NGỮ với nội dung. 
        - Nếu nội dung là tiếng Việt, tiêu đề phải là tiếng Việt
        - Nếu nội dung là tiếng Anh, tiêu đề phải là tiếng Anh
        - Nếu nội dung là tiếng Nhật, tiêu đề phải là tiếng Nhật
        - Và tương tự cho các ngôn ngữ khác
        
        Yêu cầu về tiêu đề:
        - Ngắn gọn, súc tích (tối đa 50 ký tự)
        - Mô tả chính xác nội dung chính
        - Dễ hiểu và rõ ràng
        - Không có dấu ngoặc kép, không có ký tự đặc biệt ở đầu/cuối
        - PHẢI cùng ngôn ngữ với nội dung (quan trọng nhất)
        
        Chỉ trả về tiêu đề, không có giải thích, không có comment, không có dấu ngoặc kép bao quanh.
        
        Nội dung:
        {content[:2000]}
        """
        
        try:
            response = model.generate_content(prompt)
            
            if not response or not hasattr(response, 'text'):
                raise Exception("Gemini API không trả về text")
            
            title = response.text.strip()
            
            # Loại bỏ dấu ngoặc kép nếu có
            title = title.strip('"').strip("'").strip()
            
            # Giới hạn độ dài
            if len(title) > 100:
                title = title[:100]
            
            # Nếu title rỗng hoặc quá ngắn, dùng mặc định
            if not title or len(title) < 3:
                title = "Note từ ảnh"
            
            return title
            
        except Exception as api_error:
            error_msg = str(api_error)
            if "API key" in error_msg or "authentication" in error_msg.lower():
                raise Exception(f"Lỗi xác thực Gemini API: {error_msg}")
            raise Exception(f"Lỗi khi tạo tiêu đề: {error_msg}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Nếu lỗi khi tạo title, trả về title mặc định
        return "Note từ ảnh"

