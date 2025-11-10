# 🔌 Hướng dẫn tích hợp API vào dự án có sẵn

Nếu bạn đã có dự án sẵn và chỉ cần lấy API để tích hợp, đây là những gì bạn cần:

---

## 📦 1. Dependencies cần cài đặt

```bash
npm install axios
# hoặc
yarn add axios
```

**Lưu ý:** Nếu dự án của bạn đã có `axios`, không cần cài lại.

---

## 🔑 2. Cấu hình API FISS

Thêm vào file `.env` hoặc config của bạn:

```env
FISS_BASE_URL=http://api.thegioiaiagent.online
FISS_API_URL=http://api.thegioiaiagent.online/v1/chat-messages
FISS_API_KEY=app-Pt0aXTFxOM650QpcFSrA7CCn
```

---

## 💻 3. Code tích hợp API

### Option 1: Function đơn giản (Khuyến nghị)

Copy đoạn code này vào dự án của bạn:

```javascript
const axios = require('axios');
require('dotenv').config();

// Cấu hình
const FISS_API_URL = process.env.FISS_API_URL || 'http://api.thegioiaiagent.online/v1/chat-messages';
const FISS_API_KEY = process.env.FISS_API_KEY || 'app-Pt0aXTFxOM650QpcFSrA7CCn';

/**
 * Gửi tin nhắn đến FISS Chatbot
 * @param {string} message - Nội dung tin nhắn
 * @param {string} conversationId - ID cuộc trò chuyện (tùy chọn)
 * @param {string} userId - ID người dùng (tùy chọn)
 * @param {Function} onChunk - Callback khi nhận được chunk (chunk, fullText)
 * @param {Function} onComplete - Callback khi hoàn tất (fullResponse, conversationId)
 * @param {Function} onError - Callback khi có lỗi (error)
 */
async function sendToFISSChatbot(message, conversationId = '', userId = '', onChunk, onComplete, onError) {
    try {
        const response = await axios.post(
            FISS_API_URL,
            {
                query: message.trim(),
                conversation_id: conversationId,
                user: userId || 'user-' + Date.now(),
                response_mode: 'streaming'
            },
            {
                headers: {
                    'Authorization': `Bearer ${FISS_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream',
                timeout: 30000
            }
        );

        let buffer = '';
        let fullResponse = '';
        let finalConversationId = conversationId;

        response.data.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        if (data.event === 'agent_message' || data.event === 'message') {
                            const answer = data.answer || data.data?.answer || '';
                            if (answer) {
                                fullResponse += answer;
                                if (onChunk) onChunk(answer, fullResponse);
                            }
                        } else if (data.event === 'message_end') {
                            if (data.conversation_id) {
                                finalConversationId = data.conversation_id;
                            }
                            if (onComplete) onComplete(fullResponse, finalConversationId);
                        } else if (data.event === 'error') {
                            const error = new Error(data.message || 'Lỗi từ FISS API');
                            if (onError) onError(error);
                            throw error;
                        }
                    } catch (e) {
                        // Bỏ qua lỗi parse
                    }
                }
            }
        });

        response.data.on('end', () => {
            if (onComplete && fullResponse) {
                onComplete(fullResponse, finalConversationId);
            }
        });

        response.data.on('error', (error) => {
            if (onError) onError(error);
        });

    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const errorMsg = `Lỗi API FISS: ${status}`;
            if (onError) onError(new Error(errorMsg));
        } else {
            if (onError) onError(error);
        }
        throw error;
    }
}

module.exports = { sendToFISSChatbot };
```

### Cách sử dụng:

```javascript
const { sendToFISSChatbot } = require('./fiss-api');

// Sử dụng
sendToFISSChatbot(
    'Bảo hiểm xe máy là gì?',
    '', // conversationId (để trống nếu mới)
    'user-123', // userId
    // onChunk - nhận từng phần phản hồi
    (chunk, fullText) => {
        console.log('Chunk:', chunk);
        console.log('Full so far:', fullText);
    },
    // onComplete - nhận phản hồi hoàn chỉnh
    (fullResponse, conversationId) => {
        console.log('Complete:', fullResponse);
        console.log('Conversation ID:', conversationId);
        // Lưu conversationId để dùng cho lần sau
    },
    // onError - xử lý lỗi
    (error) => {
        console.error('Error:', error.message);
    }
);
```

---

### Option 2: Express Route (Nếu dùng Express)

Nếu dự án của bạn dùng Express, copy route này:

```javascript
const express = require('express');
const axios = require('axios');
const router = express.Router();

const FISS_API_URL = process.env.FISS_API_URL || 'http://api.thegioiaiagent.online/v1/chat-messages';
const FISS_API_KEY = process.env.FISS_API_KEY || 'app-Pt0aXTFxOM650QpcFSrA7CCn';

router.post('/chat', async (req, res) => {
    try {
        const { message, conversationId, userId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Tin nhắn không được để trống' });
        }

        const response = await axios.post(
            FISS_API_URL,
            {
                query: message.trim(),
                conversation_id: conversationId || '',
                user: userId || 'user-' + Date.now(),
                response_mode: 'streaming'
            },
            {
                headers: {
                    'Authorization': `Bearer ${FISS_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream',
                timeout: 30000
            }
        );

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let buffer = '';
        let fullResponse = '';
        let finalConversationId = conversationId || '';

        response.data.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        if (data.event === 'agent_message' || data.event === 'message') {
                            const answer = data.answer || data.data?.answer || '';
                            if (answer) {
                                fullResponse += answer;
                                res.write(`data: ${JSON.stringify({
                                    type: 'chunk',
                                    content: answer,
                                    conversationId: finalConversationId
                                })}\n\n`);
                            }
                        } else if (data.event === 'message_end') {
                            if (data.conversation_id) {
                                finalConversationId = data.conversation_id;
                            }
                            res.write(`data: ${JSON.stringify({
                                type: 'end',
                                conversationId: finalConversationId,
                                fullResponse: fullResponse
                            })}\n\n`);
                            res.end();
                        } else if (data.event === 'error') {
                            res.write(`data: ${JSON.stringify({
                                type: 'error',
                                error: data.message || 'Lỗi từ FISS API'
                            })}\n\n`);
                            res.end();
                        }
                    } catch (e) {
                        // Bỏ qua
                    }
                }
            }
        });

        response.data.on('error', (error) => {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: 'Lỗi stream'
            })}\n\n`);
            res.end();
        });

    } catch (error) {
        res.status(500).json({
            error: error.message || 'Lỗi máy chủ'
        });
    }
});

module.exports = router;
```

---

## 📋 Tóm tắt những gì cần lấy

### ✅ Bắt buộc:
1. **Dependencies**: `axios`
2. **Cấu hình**: API URL và API Key
3. **Code logic**: Function gọi API FISS (từ `server.js` dòng 48-291)

### ✅ Tùy chọn:
- Xử lý streaming response
- Quản lý conversationId
- Error handling

---

## 🎯 File cần tham khảo trong dự án này

1. **`server.js`** (dòng 48-291): Logic chính gọi API FISS
2. **`package.json`**: Dependencies cần thiết
3. **`.env`**: Cấu hình API (không commit)

---

## 💡 Lưu ý

- **API Key**: Không commit API Key vào Git, dùng biến môi trường
- **Streaming**: API trả về Server-Sent Events, cần xử lý stream
- **Conversation ID**: Lưu lại để duy trì ngữ cảnh cuộc trò chuyện
- **Error Handling**: Luôn xử lý lỗi từ API FISS

---

**Tóm lại:** Bạn chỉ cần copy logic từ `server.js` (phần gọi API FISS) và cấu hình API Key là đủ!
