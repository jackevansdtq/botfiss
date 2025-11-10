# 📮 Hướng dẫn sử dụng Postman để test FISS API

## 📥 Cách import Postman Collection

### Bước 1: Tải file Collection
- File: `FISS_API.postman_collection.json`
- Đã có sẵn trong dự án

### Bước 2: Import vào Postman

1. Mở **Postman**
2. Click **Import** (góc trên bên trái)
3. Chọn **File** → Chọn file `FISS_API.postman_collection.json`
4. Click **Import**

### Bước 3: Sử dụng

Sau khi import, bạn sẽ thấy collection **"FISS API Collection"** với 3 requests:
- **Chat - Blocking Mode**: Test với blocking response
- **Chat - Streaming Mode**: Test với streaming response  
- **Chat - Với Conversation ID**: Test với conversation ID

---

## 🧪 Cách test từng request

### 1. Test Blocking Mode

1. Chọn request **"Chat - Blocking Mode"**
2. Click **Send**
3. Xem response trong tab **Body**

**Response sẽ trả về ngay:**
```json
{
  "conversation_id": "abc123...",
  "message_id": "xyz789...",
  "answer": "Dạ, chào anh/chị!...",
  ...
}
```

### 2. Test Streaming Mode

1. Chọn request **"Chat - Streaming Mode"**
2. Click **Send**
3. Xem response trong tab **Body** (sẽ hiển thị từng chunk)

**Response sẽ stream:**
```
data: {"event": "message", "answer": "Phần 1..."}
data: {"event": "message", "answer": "Phần 2..."}
data: {"event": "message_end", "conversation_id": "abc123"}
```

### 3. Test với Conversation ID

1. **Lần 1**: Chạy request **"Chat - Blocking Mode"** hoặc **"Chat - Streaming Mode"**
2. **Copy** `conversation_id` từ response
3. Vào **Variables** của collection → Set `conversation_id` = giá trị vừa copy
4. Chạy request **"Chat - Với Conversation ID"**
5. Bot sẽ nhớ ngữ cảnh cuộc trò chuyện trước

---

## 🔧 Cách chỉnh sửa request

### Thay đổi câu hỏi:

1. Chọn request
2. Vào tab **Body**
3. Sửa giá trị `"query"`:
```json
{
    "query": "Câu hỏi của bạn ở đây",
    "inputs": {},
    "response_mode": "streaming",
    "user": "user-123"
}
```

### Thay đổi API Key:

1. Chọn request
2. Vào tab **Headers**
3. Sửa giá trị `Authorization`:
```
Bearer app-Pt0aXTFxOM650QpcFSrA7CCn
```

---

## 📋 Các request có sẵn

### 1. Chat - Blocking Mode
- **Method**: POST
- **URL**: `http://api.thegioiaiagent.online/v1/chat-messages`
- **Body**: 
  - `query`: "Xin chào"
  - `inputs`: {}
  - `response_mode`: "blocking"
  - `user`: "user-123"

### 2. Chat - Streaming Mode
- **Method**: POST
- **URL**: `http://api.thegioiaiagent.online/v1/chat-messages`
- **Body**:
  - `query`: "Bảo hiểm xe máy là gì?"
  - `inputs`: {}
  - `response_mode`: "streaming"
  - `user`: "user-123"

### 3. Chat - Với Conversation ID
- **Method**: POST
- **URL**: `http://api.thegioiaiagent.online/v1/chat-messages`
- **Body**:
  - `query`: "Bảo hiểm ô tô là gì?"
  - `inputs`: {}
  - `conversation_id`: "{{conversation_id}}"
  - `response_mode`: "streaming"
  - `user`: "user-123"

---

## 💡 Tips

1. **Lưu conversation_id**: 
   - Copy từ response
   - Set vào variable `conversation_id` để dùng cho request tiếp theo

2. **Test nhiều câu hỏi**:
   - Duplicate request
   - Sửa `query` để test các câu hỏi khác nhau

3. **Xem response chi tiết**:
   - Tab **Body**: Xem nội dung response
   - Tab **Headers**: Xem headers response
   - Tab **Cookies**: Xem cookies (nếu có)

---

## ❌ Xử lý lỗi

### Lỗi 401 Unauthorized:
- Kiểm tra API Key trong header `Authorization`
- Đảm bảo format: `Bearer app-xxxxx`

### Lỗi 400 Bad Request:
- Kiểm tra request body có đầy đủ:
  - `query` (bắt buộc)
  - `inputs` (bắt buộc - có thể là `{}`)
  - `response_mode` (tùy chọn)

### Lỗi 500 Internal Server Error:
- Liên hệ admin API

---

## 🎯 Tóm tắt

1. ✅ Import file `FISS_API.postman_collection.json` vào Postman
2. ✅ Chọn request muốn test
3. ✅ Click **Send**
4. ✅ Xem response
5. ✅ Copy `conversation_id` nếu cần tiếp tục cuộc trò chuyện

**Chúc bạn test thành công! 🚀**

