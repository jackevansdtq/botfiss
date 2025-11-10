# ⚡ Tích hợp tối thiểu - Chỉ cần những gì này

Nếu bạn chỉ gửi **3 dòng cấu hình** cho backend team, họ **KHÔNG thể** tích hợp được chatbot.

## ❌ Chỉ có cấu hình KHÔNG ĐỦ:

```env
DIFY_BASE_URL=http://api.thegioiaiagent.online
DIFY_API_URL=http://api.thegioiaiagent.online/v1/chat-messages
DIFY_API_KEY=app-Pt0aXTFxOM650QpcFSrA7CCn
```

---

## ✅ Cần gửi thêm:

### 1. **Dependencies** (bắt buộc)
```bash
npm install axios
```

### 2. **Code logic** (bắt buộc)

Copy đoạn code này vào dự án của họ:

```javascript
const axios = require('axios');

const DIFY_API_URL = process.env.DIFY_API_URL || 'http://api.thegioiaiagent.online/v1/chat-messages';
const DIFY_API_KEY = process.env.DIFY_API_KEY || 'app-Pt0aXTFxOM650QpcFSrA7CCn';

async function sendToDifyChatbot(message, conversationId = '', userId = '') {
    const response = await axios.post(
        DIFY_API_URL,
        {
            query: message.trim(),
            conversation_id: conversationId,
            user: userId || 'user-' + Date.now(),
            response_mode: 'streaming'
        },
        {
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'stream',
            timeout: 30000
        }
    );

    let buffer = '';
    let fullResponse = '';
    let finalConversationId = conversationId;

    return new Promise((resolve, reject) => {
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
                            }
                        } else if (data.event === 'message_end') {
                            if (data.conversation_id) {
                                finalConversationId = data.conversation_id;
                            }
                            resolve({
                                response: fullResponse,
                                conversationId: finalConversationId
                            });
                        } else if (data.event === 'error') {
                            reject(new Error(data.message || 'Lỗi từ Dify API'));
                        }
                    } catch (e) {
                        // Bỏ qua
                    }
                }
            }
        });

        response.data.on('error', (error) => {
            reject(error);
        });
    });
}

module.exports = { sendToDifyChatbot };
```

### 3. **Cách sử dụng**

```javascript
const { sendToDifyChatbot } = require('./dify-api');

// Sử dụng
const result = await sendToDifyChatbot(
    'Bảo hiểm xe máy là gì?',
    '', // conversationId (để trống nếu mới)
    'user-123' // userId
);

console.log('Response:', result.response);
console.log('Conversation ID:', result.conversationId);
```

---

## 📋 Checklist gửi cho backend team:

- [x] 3 dòng cấu hình (API URL, API Key)
- [x] Code function gọi API (copy từ trên)
- [x] Hướng dẫn cài `axios`
- [x] Ví dụ cách sử dụng

---

## 🎯 Tóm lại:

**Chỉ gửi 3 dòng cấu hình = KHÔNG ĐỦ** ❌

**Cần gửi:**
1. ✅ 3 dòng cấu hình
2. ✅ Code function (bắt buộc)
3. ✅ Dependencies (axios)
4. ✅ Ví dụ sử dụng

→ Xem file `INTEGRATION_GUIDE.md` để có hướng dẫn đầy đủ hơn!

