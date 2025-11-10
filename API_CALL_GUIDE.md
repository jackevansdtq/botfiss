# 📞 Hướng dẫn gọi API FISS

Với thông tin API bạn đã nhận được:

```
FISS_API_URL=http://api.thegioiaiagent.online/v1/chat-messages
FISS_API_KEY=app-Pt0aXTFxOM650QpcFSrA7CCn
```

---

## 🚀 Cách 1: Sử dụng cURL (Test nhanh)

### Gọi API đơn giản:

```bash
curl -X POST 'http://api.thegioiaiagent.online/v1/chat-messages' \
  -H 'Authorization: Bearer app-Pt0aXTFxOM650QpcFSrA7CCn' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "Xin chào",
    "inputs": {},
    "response_mode": "blocking",
    "user": "user-123"
  }'
```

### Gọi API với streaming:

```bash
curl -X POST 'http://api.thegioiaiagent.online/v1/chat-messages' \
  -H 'Authorization: Bearer app-Pt0aXTFxOM650QpcFSrA7CCn' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "Bảo hiểm xe máy là gì?",
    "inputs": {},
    "response_mode": "streaming",
    "user": "user-123"
  }'
```

---

## 💻 Cách 2: JavaScript/Node.js

### Option A: Sử dụng Fetch API (Browser/Node.js 18+)

```javascript
async function callFISSAPI(message, conversationId = '') {
    const response = await fetch('http://api.thegioiaiagent.online/v1/chat-messages', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: message,
            inputs: {},
            conversation_id: conversationId,
            user: 'user-123',
            response_mode: 'streaming'
        })
    });

    // Xử lý streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullResponse = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.event === 'message' || data.event === 'agent_message') {
                        const answer = data.answer || data.data?.answer || '';
                        fullResponse += answer;
                        console.log('Chunk:', answer);
                    } else if (data.event === 'message_end') {
                        console.log('Complete:', fullResponse);
                        return fullResponse;
                    }
                } catch (e) {
                    // Skip parse errors
                }
            }
        }
    }

    return fullResponse;
}

// Sử dụng
callFISSAPI('Bảo hiểm xe máy là gì?')
    .then(response => console.log('Response:', response))
    .catch(error => console.error('Error:', error));
```

### Option B: Sử dụng Axios (Node.js)

```javascript
const axios = require('axios');

async function callFISSAPI(message, conversationId = '') {
    try {
        const response = await axios.post(
            'http://api.thegioiaiagent.online/v1/chat-messages',
            {
                query: message,
                inputs: {},
                conversation_id: conversationId,
                user: 'user-123',
                response_mode: 'streaming'
            },
            {
                headers: {
                    'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            }
        );

        let buffer = '';
        let fullResponse = '';

        return new Promise((resolve, reject) => {
            response.data.on('data', (chunk) => {
                buffer += chunk.toString('utf-8');
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.event === 'message' || data.event === 'agent_message') {
                                const answer = data.answer || data.data?.answer || '';
                                fullResponse += answer;
                                console.log('Chunk:', answer);
                            } else if (data.event === 'message_end') {
                                resolve(fullResponse);
                            } else if (data.event === 'error') {
                                reject(new Error(data.message || 'API Error'));
                            }
                        } catch (e) {
                            // Skip parse errors
                        }
                    }
                }
            });

            response.data.on('error', reject);
        });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        throw error;
    }
}

// Sử dụng
callFISSAPI('Bảo hiểm xe máy là gì?')
    .then(response => console.log('Response:', response))
    .catch(error => console.error('Error:', error));
```

---

## 🐍 Cách 3: Python

```python
import requests
import json

def call_fiss_api(message, conversation_id=''):
    url = 'http://api.thegioiaiagent.online/v1/chat-messages'
    headers = {
        'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
        'Content-Type': 'application/json'
    }
    data = {
        'query': message,
        'inputs': {},
        'conversation_id': conversation_id,
        'user': 'user-123',
        'response_mode': 'streaming'
    }
    
    response = requests.post(url, json=data, headers=headers, stream=True)
    response.raise_for_status()
    
    full_response = ''
    
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                try:
                    event_data = json.loads(line[6:])
                    
                    if event_data.get('event') in ['message', 'agent_message']:
                        answer = event_data.get('answer') or event_data.get('data', {}).get('answer', '')
                        full_response += answer
                        print('Chunk:', answer)
                    elif event_data.get('event') == 'message_end':
                        print('Complete:', full_response)
                        return full_response
                except json.JSONDecodeError:
                    pass
    
    return full_response

# Sử dụng
response = call_fiss_api('Bảo hiểm xe máy là gì?')
print('Final Response:', response)
```

---

## 📋 Request Format

### Headers (Bắt buộc):
```
Authorization: Bearer app-Pt0aXTFxOM650QpcFSrA7CCn
Content-Type: application/json
```

### Request Body:
```json
{
  "query": "Câu hỏi của bạn",
  "inputs": {},           // Bắt buộc - object rỗng hoặc các input variables
  "conversation_id": "",  // Để trống nếu cuộc trò chuyện mới
  "user": "user-123",     // ID người dùng (tùy chọn)
  "response_mode": "streaming"  // "streaming" hoặc "blocking"
}
```

### Response Format (Streaming):

```
data: {"event": "message", "answer": "Phần 1 của câu trả lời"}
data: {"event": "message", "answer": "Phần 2 của câu trả lời"}
data: {"event": "message_end", "conversation_id": "abc123"}
```

---

## 🔧 Các tham số quan trọng

| Tham số | Loại | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `query` | string | ✅ Có | Câu hỏi/tin nhắn của người dùng |
| `inputs` | object | ✅ Có | Input variables (có thể là object rỗng `{}`) |
| `conversation_id` | string | ❌ Không | ID cuộc trò chuyện (để tiếp tục hội thoại) |
| `user` | string | ❌ Không | ID người dùng (mặc định: tự động tạo) |
| `response_mode` | string | ❌ Không | "streaming" (mặc định) hoặc "blocking" |

---

## 💬 Conversation ID - Lấy ở đâu?

### 📍 Conversation ID được trả về từ API Response

**Lần đầu tiên gọi API:**
- Để `conversation_id` là chuỗi rỗng `""` hoặc không gửi
- API sẽ tự động tạo `conversation_id` mới
- **Lấy từ response** và lưu lại để dùng cho lần sau

### 🔍 Cách lấy Conversation ID từ Response:

#### Với Streaming Response:

```javascript
// Trong response event "message_end"
if (data.event === 'message_end') {
    const conversationId = data.conversation_id; // ← Lấy ở đây!
    console.log('Conversation ID:', conversationId);
    // Lưu lại để dùng cho lần sau
}
```

#### Với Blocking Response:

```json
{
  "conversation_id": "dbcd5218-6e88-4b68-a14f-aa572e70bcc3",  // ← Lấy ở đây!
  "message_id": "a94c2627-fc62-4eb3-bae4-a79fcde5212c",
  "answer": "Dạ, chào anh/chị!...",
  ...
}
```

### 📝 Ví dụ đầy đủ:

```javascript
let conversationId = ''; // Lưu conversation ID ở đây

// Lần 1: Gọi API (chưa có conversation ID)
async function firstCall() {
    const response = await fetch('http://api.thegioiaiagent.online/v1/chat-messages', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: 'Xin chào',
            inputs: {},
            conversation_id: '', // ← Để trống lần đầu
            user: 'user-123',
            response_mode: 'streaming'
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
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
                
                if (data.event === 'message_end') {
                    // ← LẤY CONVERSATION ID Ở ĐÂY!
                    conversationId = data.conversation_id;
                    console.log('Conversation ID mới:', conversationId);
                    // Lưu vào localStorage hoặc database
                    localStorage.setItem('conversationId', conversationId);
                }
            }
        }
    }
}

// Lần 2: Gọi API (đã có conversation ID)
async function secondCall() {
    // Lấy conversation ID đã lưu
    const savedConversationId = localStorage.getItem('conversationId') || '';
    
    const response = await fetch('http://api.thegioiaiagent.online/v1/chat-messages', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: 'Bảo hiểm xe máy là gì?',
            inputs: {},
            conversation_id: savedConversationId, // ← Dùng conversation ID đã lưu
            user: 'user-123',
            response_mode: 'streaming'
        })
    });
    
    // ... xử lý response
}
```

### 🎯 Tóm tắt:

1. **Lần đầu tiên**: 
   - Gửi `conversation_id: ""` (để trống)
   - API tạo mới và trả về trong response

2. **Lấy từ response**:
   - Streaming: `data.conversation_id` trong event `message_end`
   - Blocking: `response.conversation_id` trong JSON response

3. **Lần sau**:
   - Dùng `conversation_id` đã lưu để tiếp tục cuộc trò chuyện
   - Bot sẽ nhớ ngữ cảnh cuộc trò chuyện trước đó

### 💾 Nơi lưu Conversation ID:

- **Browser**: `localStorage`, `sessionStorage`
- **Mobile App**: SharedPreferences, UserDefaults, hoặc database
- **Backend**: Database (MySQL, MongoDB, Redis...)
- **Cookie**: Lưu trong cookie (nếu dùng web)

---

## ⚠️ Lưu ý quan trọng

1. **API Key phải đúng:**
   - Format: `Bearer app-Pt0aXTFxOM650QpcFSrA7CCn`
   - Không có khoảng trắng thừa

2. **URL phải đúng:**
   - `http://api.thegioiaiagent.online/v1/chat-messages`
   - Không có dấu `/` ở cuối

3. **Streaming Response:**
   - API trả về Server-Sent Events (SSE)
   - Cần xử lý từng dòng `data: {...}`
   - Parse JSON từ mỗi dòng

4. **Conversation ID:**
   - Lưu lại `conversation_id` từ response
   - Gửi lại trong request tiếp theo để duy trì ngữ cảnh

---

## 🧪 Test API

### Test với cURL:

```bash
# Test blocking mode
curl -X POST 'http://api.thegioiaiagent.online/v1/chat-messages' \
  -H 'Authorization: Bearer app-Pt0aXTFxOM650QpcFSrA7CCn' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "Xin chào",
    "inputs": {},
    "response_mode": "blocking",
    "user": "test-user"
  }'
```

### Test với Postman:

1. Method: **POST**
2. URL: `http://api.thegioiaiagent.online/v1/chat-messages`
3. Headers:
   - `Authorization`: `Bearer app-Pt0aXTFxOM650QpcFSrA7CCn`
   - `Content-Type`: `application/json`
4. Body (raw JSON):
```json
{
  "query": "Xin chào",
  "inputs": {},
  "response_mode": "blocking",
  "user": "test-user"
}
```

---

## 📝 Ví dụ đầy đủ: Duy trì cuộc trò chuyện

```javascript
let conversationId = '';

async function chatWithFISS(message) {
    const response = await fetch('http://api.thegioiaiagent.online/v1/chat-messages', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: message,
            inputs: {},
            conversation_id: conversationId, // Dùng conversation ID đã lưu
            user: 'user-123',
            response_mode: 'streaming'
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullResponse = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.event === 'message' || data.event === 'agent_message') {
                        const answer = data.answer || data.data?.answer || '';
                        fullResponse += answer;
                    } else if (data.event === 'message_end') {
                        // Lưu conversation ID để dùng cho lần sau
                        if (data.conversation_id) {
                            conversationId = data.conversation_id;
                        }
                        return fullResponse;
                    }
                } catch (e) {
                    // Skip
                }
            }
        }
    }

    return fullResponse;
}

// Sử dụng
chatWithFISS('Xin chào')
    .then(response => {
        console.log('Response 1:', response);
        // Tiếp tục cuộc trò chuyện
        return chatWithFISS('Bảo hiểm xe máy là gì?');
    })
    .then(response => {
        console.log('Response 2:', response);
    });
```

---

## ❌ Xử lý lỗi

### Lỗi 401 Unauthorized:
```json
{
  "error": "Invalid API key"
}
```
→ Kiểm tra lại API Key

### Lỗi 400 Bad Request:
```json
{
  "error": "query is required"
}
```
→ Kiểm tra request body có đầy đủ tham số

### Lỗi 500 Internal Server Error:
→ Liên hệ admin API

---

## 🎯 Tóm tắt

**Để gọi API FISS, bạn cần:**

1. ✅ **URL**: `http://api.thegioiaiagent.online/v1/chat-messages`
2. ✅ **Header**: `Authorization: Bearer app-Pt0aXTFxOM650QpcFSrA7CCn`
3. ✅ **Method**: `POST`
4. ✅ **Body**: JSON với `query`, `conversation_id`, `user`, `response_mode`

**Response**: Server-Sent Events (SSE) - cần parse từng dòng `data: {...}`

---

**Chúc bạn tích hợp thành công! 🚀**

