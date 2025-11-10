# 📚 Tài liệu API Chatbot

## 🔗 Base URL
```
http://your-server-domain.com
```
*Thay `your-server-domain.com` bằng domain thực tế của bạn*

---

## 📋 Các Endpoint

### 1. Health Check
Kiểm tra trạng thái của API server.

**Endpoint:** `GET /api/health`

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

### 2. Gửi tin nhắn (Streaming)
Gửi tin nhắn đến chatbot và nhận phản hồi dưới dạng Server-Sent Events (SSE).

**Endpoint:** `POST /api/chat`

**Request Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Bảo hiểm xe máy là gì?",
  "conversationId": "optional-conversation-id",
  "userId": "optional-user-id"
}
```

**Request Parameters:**
| Tham số | Loại | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `message` | string | ✅ Có | Nội dung tin nhắn của người dùng |
| `conversationId` | string | ❌ Không | ID cuộc trò chuyện (để tiếp tục cuộc hội thoại). Nếu không có, sẽ tạo mới |
| `userId` | string | ❌ Không | ID người dùng. Nếu không có, sẽ tự động tạo |

**Response:**
Server trả về **Server-Sent Events (SSE)** stream với các event types:

#### Event: `chunk`
Phần nội dung phản hồi từ chatbot (streaming):
```json
data: {"type":"chunk","content":"Bảo hiểm xe máy","conversationId":"abc123"}
```

#### Event: `end`
Kết thúc phản hồi:
```json
data: {"type":"end","conversationId":"abc123","fullResponse":"Bảo hiểm xe máy là..."}
```

#### Event: `error`
Lỗi xảy ra:
```json
data: {"type":"error","error":"Lỗi từ Dify API"}
```

**Response Headers:**
```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Ví dụ cURL:**
```bash
curl -X POST http://your-server-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bảo hiểm xe máy là gì?",
    "conversationId": "",
    "userId": "user-123"
  }'
```

**Ví dụ JavaScript (Fetch API):**
```javascript
async function sendMessage(message, conversationId = '', userId = '') {
  const response = await fetch('http://your-server-domain.com/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      conversationId: conversationId,
      userId: userId
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.type === 'chunk') {
          // Hiển thị từng phần phản hồi
          console.log('Chunk:', data.content);
        } else if (data.type === 'end') {
          // Phản hồi hoàn tất
          console.log('Full response:', data.fullResponse);
          console.log('Conversation ID:', data.conversationId);
        } else if (data.type === 'error') {
          // Xử lý lỗi
          console.error('Error:', data.error);
        }
      }
    }
  }
}
```

**Ví dụ Python:**
```python
import requests
import json

def send_message(message, conversation_id='', user_id=''):
    url = 'http://your-server-domain.com/api/chat'
    data = {
        'message': message,
        'conversationId': conversation_id,
        'userId': user_id
    }
    
    response = requests.post(url, json=data, stream=True)
    
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                event_data = json.loads(line[6:])
                
                if event_data['type'] == 'chunk':
                    print(event_data['content'], end='', flush=True)
                elif event_data['type'] == 'end':
                    print('\n')
                    print(f"Conversation ID: {event_data['conversationId']}")
                elif event_data['type'] == 'error':
                    print(f"Error: {event_data['error']}")

# Sử dụng
send_message("Bảo hiểm xe máy là gì?")
```

---

### 3. Lấy lịch sử cuộc trò chuyện
Lấy toàn bộ lịch sử tin nhắn của một cuộc trò chuyện.

**Endpoint:** `GET /api/conversation/:conversationId`

**Request:**
```http
GET /api/conversation/abc123
```

**Response:**
```json
{
  "conversationId": "abc123",
  "messages": [
    {
      "role": "user",
      "content": "Bảo hiểm xe máy là gì?",
      "timestamp": "2025-11-10T12:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Bảo hiểm xe máy là...",
      "timestamp": "2025-11-10T12:00:01.000Z"
    }
  ],
  "createdAt": "2025-11-10T12:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Không tìm thấy cuộc trò chuyện"
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Mô tả |
|------|-------|
| 200 | Thành công |
| 400 | Bad Request - Dữ liệu request không hợp lệ |
| 404 | Not Found - Không tìm thấy resource |
| 500 | Internal Server Error - Lỗi máy chủ |
| 408 | Request Timeout - Yêu cầu mất quá nhiều thời gian |

### Error Response Format
```json
{
  "error": "Mô tả lỗi",
  "status": 400,
  "details": {} // Chỉ có trong development mode
}
```

**Ví dụ lỗi:**
```json
{
  "error": "Tin nhắn không được để trống"
}
```

---

## 🔄 Luồng hoạt động

1. **Lần đầu tiên:**
   - Gửi `POST /api/chat` với `conversationId` rỗng
   - Server tạo `conversationId` mới
   - Lưu `conversationId` từ response để dùng cho các lần sau

2. **Tiếp tục cuộc trò chuyện:**
   - Gửi `POST /api/chat` với `conversationId` đã lưu
   - Bot sẽ nhớ ngữ cảnh cuộc trò chuyện trước đó

3. **Lấy lịch sử:**
   - Gọi `GET /api/conversation/:conversationId` để xem toàn bộ lịch sử

---

## 📝 Lưu ý quan trọng

1. **Streaming Response:**
   - API sử dụng Server-Sent Events (SSE) để stream phản hồi
   - Client cần xử lý stream để hiển thị phản hồi theo thời gian thực
   - Mỗi chunk là một phần của phản hồi cuối cùng

2. **Conversation ID:**
   - Lưu `conversationId` từ response để duy trì ngữ cảnh
   - Nếu không gửi `conversationId`, mỗi request sẽ tạo cuộc trò chuyện mới

3. **Timeout:**
   - Request timeout mặc định: 30 giây
   - Nếu chatbot mất quá nhiều thời gian, sẽ trả về lỗi 408

4. **CORS:**
   - API hỗ trợ CORS, có thể gọi từ bất kỳ domain nào

5. **Rate Limiting:**
   - Hiện tại chưa có rate limiting
   - Nên implement ở phía client để tránh spam

---

## 🧪 Test API

### Sử dụng cURL:
```bash
# Health check
curl http://your-server-domain.com/api/health

# Gửi tin nhắn
curl -X POST http://your-server-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào"}'

# Lấy lịch sử
curl http://your-server-domain.com/api/conversation/abc123
```

### Sử dụng Postman:
1. Import collection từ file này (nếu có)
2. Set base URL trong environment variables
3. Test từng endpoint

---

## 📞 Liên hệ

Nếu có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ team phát triển.

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-10

