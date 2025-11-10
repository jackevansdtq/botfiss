# 📋 Hướng dẫn: Lấy thông tin từ Dify/FISS để tích hợp

Nếu bạn chưa biết gì về Dify/FISS, đây là những gì bạn cần lấy từ Dify Dashboard:

---

## 🎯 Những gì cần lấy từ Dify

### 1. **API Key** (Bắt buộc) 🔑

Đây là thông tin **QUAN TRỌNG NHẤT** - không có API Key thì không thể gọi API.

**Cách lấy:**

1. Đăng nhập vào **Dify Dashboard**
   - URL thường là: `https://your-dify-instance.com` hoặc `https://dify.ai`
   
2. Vào **"Apps"** hoặc **"Workflows"**
   - Chọn Chat App hoặc Workflow bạn muốn sử dụng
   
3. Click vào tab **"API"** hoặc **"Settings"** → **"API"**
   
4. Copy **"API Key"**
   - Format: `app-xxxxx` (ví dụ: `app-Pt0aXTFxOM650QpcFSrA7CCn`)
   - ⚠️ **Lưu ý:** API Key chỉ hiển thị 1 lần, hãy copy ngay!

**Ví dụ:**
```
API Key: app-Pt0aXTFxOM650QpcFSrA7CCn
```

---

### 2. **API URL/Endpoint** (Bắt buộc) 🌐

URL để gọi API - thường có sẵn trong Dify Dashboard.

**Cách lấy:**

1. Vào tab **"API"** của Chat App/Workflow
2. Tìm **"API Endpoint"** hoặc **"Base URL"**
3. Copy URL

**Ví dụ:**
```
Base URL: http://api.thegioiaiagent.online
API Endpoint: http://api.thegioiaiagent.online/v1/chat-messages
```

**Lưu ý:**
- **Chat App** → Endpoint: `/v1/chat-messages`
- **Workflow** → Endpoint: `/v1/workflows/run`

---

### 3. **Workflow ID** (Chỉ cho Workflow) 🔄

Nếu bạn dùng **Workflow** (không phải Chat App), cần thêm Workflow ID.

**Cách lấy:**

1. Vào **"Workflows"** trong Dify Dashboard
2. Chọn Workflow bạn muốn dùng
3. Vào tab **"API"** hoặc **"Settings"**
4. Copy **"Workflow ID"**
   - Format: UUID (ví dụ: `561bd084-a397-4f2b-a3de-91255b6d2f6c`)

**Ví dụ:**
```
Workflow ID: 561bd084-a397-4f2b-a3de-91255b6d2f6c
```

**Lưu ý:** 
- Chỉ cần nếu dùng **Workflow**
- **Chat App** không cần Workflow ID

---

## 📝 Checklist: Những gì cần lấy

### ✅ Cho Chat App:
- [ ] **API Key** (bắt buộc)
- [ ] **API URL/Endpoint** (bắt buộc)
- [ ] Workflow ID (không cần)

### ✅ Cho Workflow:
- [ ] **API Key** (bắt buộc)
- [ ] **API URL/Endpoint** (bắt buộc)
- [ ] **Workflow ID** (bắt buộc)

---

## 🔍 Cách xác định bạn đang dùng Chat App hay Workflow

### Chat App:
- Trong Dify Dashboard → **"Apps"** → **"Chat App"**
- Endpoint: `/v1/chat-messages`
- **Không cần** Workflow ID

### Workflow:
- Trong Dify Dashboard → **"Workflows"**
- Endpoint: `/v1/workflows/run`
- **Cần** Workflow ID

---

## 📸 Ví dụ vị trí trong Dify Dashboard

### Bước 1: Đăng nhập Dify
```
https://your-dify-instance.com
→ Đăng nhập với tài khoản của bạn
```

### Bước 2: Chọn App/Workflow
```
Dashboard
├── Apps (cho Chat App)
│   └── [Chọn Chat App của bạn]
└── Workflows (cho Workflow)
    └── [Chọn Workflow của bạn]
```

### Bước 3: Vào tab API
```
[App/Workflow Settings]
├── Overview
├── API ← Vào đây!
│   ├── API Key: app-xxxxx
│   ├── Base URL: http://api.thegioiaiagent.online
│   └── Endpoint: /v1/chat-messages
└── Settings
```

---

## 💾 Lưu thông tin vào file `.env`

Sau khi lấy được thông tin, tạo file `.env`:

### Cho Chat App:
```env
FISS_BASE_URL=http://api.thegioiaiagent.online
FISS_API_URL=http://api.thegioiaiagent.online/v1/chat-messages
FISS_API_KEY=app-Pt0aXTFxOM650QpcFSrA7CCn
```

### Cho Workflow:
```env
FISS_BASE_URL=http://api.thegioiaiagent.online
FISS_API_URL=http://api.thegioiaiagent.online/v1/workflows/run
FISS_API_KEY=app-Pt0aXTFxOM650QpcFSrA7CCn
FISS_WORKFLOW_ID=561bd084-a397-4f2b-a3de-91255b6d2f6c
```

---

## ⚠️ Lưu ý quan trọng

1. **API Key là bí mật:**
   - ❌ Không commit vào Git
   - ✅ Dùng file `.env` và thêm vào `.gitignore`
   - ✅ Chỉ share cho người cần thiết

2. **API Key chỉ hiển thị 1 lần:**
   - Copy ngay khi tạo mới
   - Nếu mất, phải tạo API Key mới

3. **Kiểm tra quyền truy cập:**
   - Đảm bảo API Key có quyền gọi API
   - Kiểm tra trong Dify Dashboard → API → Permissions

4. **Test API Key:**
   - Dùng `curl` hoặc Postman để test
   - Xem file `INTEGRATION_GUIDE.md` để biết cách test

---

## 🧪 Test API Key

Sau khi lấy được thông tin, test ngay:

```bash
curl -X POST 'http://api.thegioiaiagent.online/v1/chat-messages' \
  -H 'Authorization: Bearer app-Pt0aXTFxOM650QpcFSrA7CCn' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "Xin chào",
    "response_mode": "blocking",
    "user": "test-user"
  }'
```

Nếu trả về JSON response → API Key đúng ✅
Nếu trả về lỗi 401/403 → API Key sai hoặc không có quyền ❌

---

## 📚 Tóm tắt

**Những gì cần lấy từ Dify:**

1. ✅ **API Key** - Bắt buộc (format: `app-xxxxx`)
2. ✅ **API URL** - Bắt buộc (ví dụ: `http://api.thegioiaiagent.online/v1/chat-messages`)
3. ✅ **Workflow ID** - Chỉ cần nếu dùng Workflow (format: UUID)

**Sau đó:**
- Lưu vào file `.env`
- Sử dụng trong code (xem `INTEGRATION_GUIDE.md`)

---

**Nếu không tìm thấy:**
- Kiểm tra lại bạn đã đăng nhập đúng tài khoản chưa
- Kiểm tra bạn có quyền truy cập App/Workflow không
- Liên hệ admin Dify để được cấp quyền

