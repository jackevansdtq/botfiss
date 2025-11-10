# ⏱️ Xử lý Timeout - API trả lời lâu

## 🔍 Vấn đề

- API trả lời quá lâu
- Sợ bị timeout request ở app
- Cần xử lý timeout đúng cách

---

## ✅ Giải pháp

### 1. **Tăng Timeout cho Request**

#### Với Axios:

```javascript
const axios = require('axios');

const response = await axios.post(
  'http://api.thegioiaiagent.online/v1/chat-messages',
  {
    query: message,
    inputs: {},
    response_mode: 'streaming'
  },
  {
    headers: {
      'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
      'Content-Type': 'application/json'
    },
    responseType: 'stream',
    timeout: 60000,  // ✅ Tăng timeout lên 60 giây (60000ms)
  }
);
```

#### Với Fetch API:

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 giây

const response = await fetch(
  'http://api.thegioiaiagent.online/v1/chat-messages',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: message,
      inputs: {},
      response_mode: 'streaming'
    }),
    signal: controller.signal  // ✅ Để có thể abort
  }
);

clearTimeout(timeoutId);
```

---

### 2. **Streaming Response - Không bị Timeout**

**Lợi ích của Streaming:**
- ✅ Nhận response từng phần (chunk) ngay khi có
- ✅ Không cần đợi toàn bộ response
- ✅ Timeout chỉ áp dụng cho connection, không phải toàn bộ response

**Ví dụ:**

```javascript
// Streaming - nhận từng chunk ngay
response.data.on('data', (chunk) => {
  // Nhận được chunk ngay → hiển thị cho user
  // Không cần đợi toàn bộ response
  console.log('Chunk:', chunk);
});
```

---

### 3. **Xử lý Timeout với Retry**

```javascript
async function callFISSAPIWithRetry(message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.post(
        'http://api.thegioiaiagent.online/v1/chat-messages',
        {
          query: message,
          inputs: {},
          response_mode: 'streaming'
        },
        {
          headers: {
            'Authorization': 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 60000  // 60 giây
        }
      );
      
      return response; // Thành công
      
    } catch (error) {
      if (error.code === 'ECONNABORTED' && i < maxRetries - 1) {
        // Timeout - thử lại
        console.log(`Timeout, retrying... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Đợi 1 giây
        continue;
      }
      throw error; // Lỗi khác hoặc hết retry
    }
  }
}
```

---

### 4. **Hiển thị Loading/Progress cho User**

```javascript
// Hiển thị loading ngay khi bắt đầu
showLoadingIndicator();

try {
  const response = await axios.post(/* ... */, {
    timeout: 60000
  });
  
  let hasReceivedData = false;
  
  response.data.on('data', (chunk) => {
    hasReceivedData = true;
    // Ẩn loading, hiển thị chunk ngay
    hideLoadingIndicator();
    displayChunk(chunk);
  });
  
  // Nếu sau 5 giây chưa có data, hiển thị thông báo
  setTimeout(() => {
    if (!hasReceivedData) {
      showMessage('Đang xử lý, vui lòng đợi...');
    }
  }, 5000);
  
} catch (error) {
  hideLoadingIndicator();
  if (error.code === 'ECONNABORTED') {
    showError('Request timeout. Vui lòng thử lại.');
  } else {
    showError('Lỗi: ' + error.message);
  }
}
```

---

## 📋 Các mức Timeout khuyến nghị

| Môi trường | Timeout | Lý do |
|------------|---------|-------|
| **Development** | 30-60 giây | Đủ thời gian để test |
| **Production** | 60-120 giây | Đảm bảo không timeout quá sớm |
| **Mobile App** | 60-90 giây | Cân bằng giữa UX và timeout |
| **Web App** | 60-120 giây | User có thể đợi lâu hơn |

---

## 🔧 Code mẫu đầy đủ (với timeout)

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
        responseType: 'stream',
        timeout: 120000  // ✅ 120 giây (2 phút)
      }
    );

    let buffer = '';
    let fullResponse = '';
    let hasReceivedData = false;
    let startTime = Date.now();

    return new Promise((resolve, reject) => {
      // Timeout cho việc nhận data đầu tiên
      const firstDataTimeout = setTimeout(() => {
        if (!hasReceivedData) {
          reject(new Error('Timeout: Không nhận được response trong 30 giây'));
        }
      }, 30000);

      response.data.on('data', chunk => {
        hasReceivedData = true;
        clearTimeout(firstDataTimeout);
        
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
                const duration = Date.now() - startTime;
                console.log(`Completed in ${duration}ms`);
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

      response.data.on('error', error => {
        clearTimeout(firstDataTimeout);
        reject(error);
      });

      response.data.on('end', () => {
        clearTimeout(firstDataTimeout);
        if (fullResponse) {
          resolve(fullResponse);
        } else if (!hasReceivedData) {
          reject(new Error('No data received'));
        }
      });
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. API trả lời quá lâu. Vui lòng thử lại.');
    }
    throw error;
  }
}
```

---

## 💡 Tips để tránh Timeout

### 1. **Dùng Streaming Mode**
```javascript
response_mode: 'streaming'  // ✅ Nhận từng chunk ngay
```

### 2. **Hiển thị Progress**
- Hiển thị loading indicator
- Hiển thị từng chunk khi nhận được
- User thấy app đang hoạt động → không nghĩ là bị treo

### 3. **Tăng Timeout hợp lý**
- Không quá ngắn (dễ timeout)
- Không quá dài (user nghĩ app bị treo)
- Khuyến nghị: 60-120 giây

### 4. **Xử lý Timeout gracefully**
```javascript
catch (error) {
  if (error.code === 'ECONNABORTED') {
    // Timeout - thông báo user
    showError('Request timeout. Vui lòng thử lại.');
  }
}
```

---

## 🎯 Tóm tắt

### ✅ Giải pháp:

1. **Tăng timeout**: `timeout: 60000` (60 giây) hoặc `120000` (120 giây)
2. **Dùng streaming**: Nhận từng chunk ngay, không đợi toàn bộ
3. **Hiển thị loading**: User biết app đang xử lý
4. **Xử lý timeout**: Thông báo user và cho phép retry

### 📝 Code nhanh:

```javascript
// Thêm timeout vào axios config
timeout: 120000  // 120 giây
```

---

**Lưu ý:** Với streaming response, timeout chỉ áp dụng cho connection. Một khi đã bắt đầu nhận chunks, sẽ không bị timeout nữa!

