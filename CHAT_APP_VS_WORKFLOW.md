# 📊 Chat App vs Workflow trong Dify

## 🔍 Sự khác biệt chính

### 1. **Chat App** (Ứng dụng Chat)
- **Endpoint**: `/v1/chat-messages`
- **Mục đích**: Tạo chatbot đơn giản, tập trung vào hội thoại
- **API Key format**: `app-xxxxx` (bắt đầu bằng "app-")
- **Dữ liệu gửi**: 
  ```json
  {
    "query": "Câu hỏi của người dùng",
    "conversation_id": "id-cuộc-trò-chuyện",
    "user": "user-id",
    "response_mode": "streaming"
  }
  ```
- **Không hỗ trợ**: `workflow_id`
- **Ưu điểm**: 
  - Đơn giản, dễ sử dụng
  - Tự động quản lý lịch sử hội thoại
  - Phù hợp cho chatbot cơ bản
- **Nhược điểm**: 
  - Ít tùy biến hơn
  - Không có logic phức tạp

### 2. **Workflow** (Quy trình làm việc)
- **Endpoint**: `/v1/workflows/run`
- **Mục đích**: Tạo quy trình phức tạp với nhiều bước, điều kiện
- **API Key format**: `app-xxxxx` (có thể dùng chung với Chat App)
- **Dữ liệu gửi**:
  ```json
  {
    "inputs": {
      "query": "Câu hỏi của người dùng"
    },
    "response_mode": "streaming",
    "user": "user-id",
    "workflow_id": "id-workflow"
  }
  ```
- **Hỗ trợ**: `workflow_id` (bắt buộc)
- **Ưu điểm**:
  - Logic phức tạp, nhiều bước
  - Có thể kết nối nhiều service
  - Tùy biến cao
  - Có thể xử lý dữ liệu, gọi API bên ngoài
- **Nhược điểm**:
  - Phức tạp hơn để setup
  - Cần cấu hình workflow trong Dify dashboard

---

## ✅ Dự án này đang dùng: **CHAT APP**

### Bằng chứng:

1. **Endpoint hiện tại**:
   ```javascript
   DIFY_API_URL = 'http://api.thegioiaiagent.online/v1/chat-messages'
   ```
   → Đây là endpoint của **Chat App**

2. **API Key format**:
   ```javascript
   DIFY_API_KEY = 'app-Pt0aXTFxOM650QpcFSrA7CCn'
   ```
   → Bắt đầu bằng `app-` → **Chat App API key**

3. **Request body**:
   ```javascript
   const difyData = {
       query: message.trim(),           // Chat App dùng "query"
       conversation_id: conversationId, // Chat App quản lý conversation_id
       user: userId,
       response_mode: 'streaming'
       // KHÔNG có workflow_id
   };
   ```

4. **Comment trong code**:
   ```javascript
   // Lưu ý: /v1/chat-messages là cho CHAT APP, không hỗ trợ workflow_id
   // workflow_id chỉ dùng cho /v1/workflows/run (workflow app)
   ```

---

## 🔄 Nếu muốn chuyển sang Workflow

### Các thay đổi cần thiết:

1. **Thay đổi endpoint**:
   ```javascript
   DIFY_API_URL = 'http://api.thegioiaiagent.online/v1/workflows/run'
   ```

2. **Thay đổi request body**:
   ```javascript
   const difyData = {
       inputs: {
           query: message.trim()  // Workflow dùng "inputs"
       },
       workflow_id: DIFY_WORKFLOW_ID,  // Bắt buộc phải có
       user: userId,
       response_mode: 'streaming'
       // KHÔNG có conversation_id (Workflow không tự quản lý)
   };
   ```

3. **Tạo Workflow trong Dify Dashboard**:
   - Đăng nhập Dify
   - Tạo Workflow mới
   - Thiết kế các bước xử lý
   - Lấy `workflow_id`

---

## 📋 So sánh nhanh

| Tính năng | Chat App | Workflow |
|-----------|----------|----------|
| **Endpoint** | `/v1/chat-messages` | `/v1/workflows/run` |
| **API Key** | `app-xxxxx` | `app-xxxxx` |
| **workflow_id** | ❌ Không cần | ✅ Bắt buộc |
| **conversation_id** | ✅ Tự quản lý | ❌ Không có |
| **Input field** | `query` | `inputs` |
| **Độ phức tạp** | Đơn giản | Phức tạp |
| **Tùy biến** | Hạn chế | Cao |
| **Use case** | Chatbot cơ bản | Quy trình phức tạp |

---

## 🎯 Kết luận

**Dự án này đang dùng Chat App** vì:
- ✅ Endpoint: `/v1/chat-messages`
- ✅ API Key: `app-xxxxx`
- ✅ Request body dùng `query` và `conversation_id`
- ✅ Không có `workflow_id` trong request

**Chat App phù hợp cho dự án này** vì:
- Đơn giản, dễ maintain
- Tự động quản lý lịch sử hội thoại
- Đủ cho nhu cầu chatbot bảo hiểm

**Chỉ nên chuyển sang Workflow nếu**:
- Cần logic phức tạp (nhiều bước, điều kiện)
- Cần kết nối với API/service bên ngoài
- Cần xử lý dữ liệu phức tạp

