# 🔑 Cách Dify Phân Biệt Nhiều Dự Án

## 🎯 Câu trả lời ngắn gọn

**Dify phân biệt dự án thông qua API Key!**

Mỗi Chat App hoặc Workflow trong Dify có một **API Key riêng biệt**. Khi gọi API, bạn gửi API Key trong header `Authorization`, và Dify sẽ dựa vào đó để biết đang gọi đến dự án nào.

---

## 📋 Cơ chế hoạt động

### 1. **API Key = Định danh dự án**

Trong Dify:
- Mỗi **Chat App** có 1 API Key riêng
- Mỗi **Workflow** có 1 API Key riêng
- API Key có format: `app-xxxxx` (cho Chat App) hoặc `app-xxxxx` (cho Workflow)

### 2. **Cách gửi API Key**

API Key được gửi trong **HTTP Header**:

```javascript
headers: {
    'Authorization': `Bearer ${DIFY_API_KEY}`,
    'Content-Type': 'application/json'
}
```

Ví dụ:
```javascript
'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn'
```

### 3. **Dify xử lý**

Khi Dify nhận request:
1. Đọc API Key từ header `Authorization`
2. Tìm Chat App/Workflow tương ứng với API Key đó
3. Xử lý request với cấu hình của dự án đó
4. Trả về kết quả

---

## 🔍 Ví dụ thực tế

### Trường hợp 1: Có 2 Chat App khác nhau

**Dự án 1: Chatbot Bảo hiểm**
- API Key: `app-Pt0aXTFxOM650QpcFSrA7CCn`
- Endpoint: `/v1/chat-messages`

**Dự án 2: Chatbot Hỗ trợ khách hàng**
- API Key: `app-ABC123XYZ789DEF456`
- Endpoint: `/v1/chat-messages`

**Cách gọi:**

```javascript
// Gọi Chatbot Bảo hiểm
const response1 = await axios.post(
    'http://api.thegioiaiagent.online/v1/chat-messages',
    { query: 'Bảo hiểm xe máy là gì?' },
    {
        headers: {
            'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
            'Content-Type': 'application/json'
        }
    }
);

// Gọi Chatbot Hỗ trợ khách hàng
const response2 = await axios.post(
    'http://api.thegioiaiagent.online/v1/chat-messages',
    { query: 'Làm sao để đổi mật khẩu?' },
    {
        headers: {
            'Authorization': 'Bearer app-ABC123XYZ789DEF456',
            'Content-Type': 'application/json'
        }
    }
);
```

→ Dify sẽ tự động biết request nào thuộc dự án nào dựa vào API Key!

---

## 🛠️ Cách lấy API Key cho từng dự án

### Bước 1: Đăng nhập Dify Dashboard
Truy cập: `https://your-dify-instance.com`

### Bước 2: Chọn dự án
- Vào **"Apps"** → Chọn Chat App bạn muốn
- Hoặc vào **"Workflows"** → Chọn Workflow bạn muốn

### Bước 3: Lấy API Key
1. Click vào **"API"** tab
2. Copy **"API Key"** (format: `app-xxxxx`)
3. Lưu lại để sử dụng

### Bước 4: Cấu hình trong code

**Option 1: Dùng biến môi trường (Khuyến nghị)**

Tạo file `.env`:
```env
# Dự án 1: Chatbot Bảo hiểm
DIFY_API_KEY_INSURANCE=app-Pt0aXTFxOM650QpcFSrA7CCn

# Dự án 2: Chatbot Hỗ trợ
DIFY_API_KEY_SUPPORT=app-ABC123XYZ789DEF456
```

Trong code:
```javascript
const DIFY_API_KEY_INSURANCE = process.env.DIFY_API_KEY_INSURANCE;
const DIFY_API_KEY_SUPPORT = process.env.DIFY_API_KEY_SUPPORT;
```

**Option 2: Dùng config object**

```javascript
const DIFY_PROJECTS = {
    insurance: {
        apiKey: 'app-Pt0aXTFxOM650QpcFSrA7CCn',
        apiUrl: 'http://api.thegioiaiagent.online/v1/chat-messages'
    },
    support: {
        apiKey: 'app-ABC123XYZ789DEF456',
        apiUrl: 'http://api.thegioiaiagent.online/v1/chat-messages'
    }
};

// Sử dụng
const project = DIFY_PROJECTS.insurance;
const headers = {
    'Authorization': `Bearer ${project.apiKey}`,
    'Content-Type': 'application/json'
};
```

---

## 🔄 Quản lý nhiều dự án trong code

### Ví dụ: Server hỗ trợ nhiều chatbot

```javascript
// server.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Cấu hình nhiều dự án
const DIFY_PROJECTS = {
    insurance: {
        name: 'Chatbot Bảo hiểm',
        apiKey: process.env.DIFY_API_KEY_INSURANCE || 'app-Pt0aXTFxOM650QpcFSrA7CCn',
        apiUrl: 'http://api.thegioiaiagent.online/v1/chat-messages'
    },
    support: {
        name: 'Chatbot Hỗ trợ',
        apiKey: process.env.DIFY_API_KEY_SUPPORT || 'app-ABC123XYZ789DEF456',
        apiUrl: 'http://api.thegioiaiagent.online/v1/chat-messages'
    },
    sales: {
        name: 'Chatbot Bán hàng',
        apiKey: process.env.DIFY_API_KEY_SALES || 'app-XYZ789ABC123DEF456',
        apiUrl: 'http://api.thegioiaiagent.online/v1/chat-messages'
    }
};

// Endpoint chung, nhận projectId
app.post('/api/chat/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const { message, conversationId, userId } = req.body;

    // Lấy cấu hình dự án
    const project = DIFY_PROJECTS[projectId];
    
    if (!project) {
        return res.status(404).json({
            error: `Không tìm thấy dự án: ${projectId}`
        });
    }

    try {
        // Gọi API Dify với API Key của dự án tương ứng
        const response = await axios.post(
            project.apiUrl,
            {
                query: message,
                conversation_id: conversationId || '',
                user: userId || 'user-' + Date.now(),
                response_mode: 'streaming'
            },
            {
                headers: {
                    'Authorization': `Bearer ${project.apiKey}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            }
        );

        // Xử lý stream response...
        res.setHeader('Content-Type', 'text/event-stream');
        response.data.pipe(res);

    } catch (error) {
        res.status(500).json({
            error: `Lỗi khi gọi ${project.name}: ${error.message}`
        });
    }
});

app.listen(6490, () => {
    console.log('Server đang chạy tại http://localhost:6490');
    console.log('Các dự án có sẵn:', Object.keys(DIFY_PROJECTS).join(', '));
});
```

**Sử dụng:**

```bash
# Gọi Chatbot Bảo hiểm
POST http://localhost:6490/api/chat/insurance
{
  "message": "Bảo hiểm xe máy là gì?",
  "userId": "user-123"
}

# Gọi Chatbot Hỗ trợ
POST http://localhost:6490/api/chat/support
{
  "message": "Làm sao để đổi mật khẩu?",
  "userId": "user-123"
}
```

---

## ⚠️ Lưu ý quan trọng

### 1. **Bảo mật API Key**
- ❌ **KHÔNG** commit API Key vào Git
- ✅ Dùng file `.env` và thêm vào `.gitignore`
- ✅ Sử dụng biến môi trường trên server production

### 2. **API Key là duy nhất**
- Mỗi API Key chỉ thuộc về 1 dự án
- Không thể dùng chung API Key cho nhiều dự án
- Nếu cần dùng nhiều dự án, phải có nhiều API Key

### 3. **Workflow cũng dùng API Key**
- Workflow cũng có API Key riêng
- Nhưng Workflow cần thêm `workflow_id` trong request body
- Endpoint khác: `/v1/workflows/run`

### 4. **Kiểm tra API Key đúng**
Nếu gọi sai API Key:
- Dify trả về lỗi `401 Unauthorized`
- Hoặc `404 Not Found` nếu API Key không tồn tại

---

## 📝 Checklist khi làm việc với nhiều dự án

- [ ] Đã lấy API Key cho từng dự án trong Dify Dashboard
- [ ] Đã lưu API Key vào file `.env` (không commit)
- [ ] Đã cấu hình code để sử dụng đúng API Key
- [ ] Đã test với từng dự án để đảm bảo hoạt động đúng
- [ ] Đã thêm `.env` vào `.gitignore`

---

## 🎯 Tóm tắt

1. **API Key = Định danh dự án**: Mỗi dự án có 1 API Key riêng
2. **Gửi trong Header**: `Authorization: Bearer {API_KEY}`
3. **Dify tự động nhận diện**: Dựa vào API Key để biết dự án nào
4. **Quản lý nhiều dự án**: Dùng object/config để lưu nhiều API Key
5. **Bảo mật**: Luôn dùng `.env`, không commit API Key

---

**Trong dự án hiện tại:**
- API Key: `app-Pt0aXTFxOM650QpcFSrA7CCn`
- Được gửi trong header: `Authorization: Bearer app-Pt0aXTFxOM650QpcFSrA7CCn`
- Dify sẽ tự động biết đây là dự án nào dựa vào API Key này!

