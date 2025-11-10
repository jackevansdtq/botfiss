# 💻 Ví dụ tích hợp API Chatbot

## 📦 Những gì bạn cần gửi cho backend team:

1. **Base URL của server** (ví dụ: `http://api.yourcompany.com` hoặc `https://chatbot.yourcompany.com`)
2. **File `API_DOCUMENTATION.md`** - Tài liệu đầy đủ về API
3. **File này** - Các ví dụ code tích hợp

---

## 🔧 Ví dụ tích hợp theo ngôn ngữ

### 1. JavaScript/TypeScript (Node.js)

```javascript
class ChatbotClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.conversationId = '';
  }

  async sendMessage(message, userId = '') {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationId: this.conversationId,
          userId: userId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
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
              
              switch (data.type) {
                case 'chunk':
                  fullResponse += data.content;
                  // Gọi callback để hiển thị từng phần
                  this.onChunk?.(data.content, fullResponse);
                  break;
                  
                case 'end':
                  this.conversationId = data.conversationId;
                  // Gọi callback khi hoàn tất
                  this.onComplete?.(data.fullResponse, data.conversationId);
                  return data.fullResponse;
                  
                case 'error':
                  throw new Error(data.error);
              }
            } catch (e) {
              console.warn('Parse error:', e);
            }
          }
        }
      }

      return fullResponse;
    } catch (error) {
      this.onError?.(error);
      throw error;
    }
  }

  // Callbacks
  onChunk = null;      // (chunk, fullText) => {}
  onComplete = null;   // (fullResponse, conversationId) => {}
  onError = null;      // (error) => {}
}

// Sử dụng
const chatbot = new ChatbotClient('http://your-server-domain.com');

chatbot.onChunk = (chunk, fullText) => {
  console.log('Chunk:', chunk);
  console.log('Full so far:', fullText);
};

chatbot.onComplete = (fullResponse, conversationId) => {
  console.log('Complete:', fullResponse);
  console.log('Conversation ID:', conversationId);
};

chatbot.onError = (error) => {
  console.error('Error:', error);
};

// Gửi tin nhắn
await chatbot.sendMessage('Bảo hiểm xe máy là gì?', 'user-123');
```

---

### 2. Python

```python
import requests
import json
from typing import Optional, Callable

class ChatbotClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.conversation_id = ''
    
    def send_message(
        self, 
        message: str, 
        user_id: str = '',
        on_chunk: Optional[Callable[[str, str], None]] = None,
        on_complete: Optional[Callable[[str, str], None]] = None,
        on_error: Optional[Callable[[Exception], None]] = None
    ) -> str:
        """
        Gửi tin nhắn đến chatbot
        
        Args:
            message: Nội dung tin nhắn
            user_id: ID người dùng
            on_chunk: Callback khi nhận được chunk (chunk, full_text)
            on_complete: Callback khi hoàn tất (full_response, conversation_id)
            on_error: Callback khi có lỗi (error)
        
        Returns:
            Phản hồi đầy đủ từ chatbot
        """
        try:
            url = f"{self.base_url}/api/chat"
            data = {
                'message': message,
                'conversationId': self.conversation_id,
                'userId': user_id
            }
            
            response = requests.post(url, json=data, stream=True, timeout=30)
            response.raise_for_status()
            
            full_response = ''
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        try:
                            event_data = json.loads(line[6:])
                            
                            if event_data['type'] == 'chunk':
                                chunk = event_data['content']
                                full_response += chunk
                                if on_chunk:
                                    on_chunk(chunk, full_response)
                                    
                            elif event_data['type'] == 'end':
                                self.conversation_id = event_data['conversationId']
                                if on_complete:
                                    on_complete(event_data['fullResponse'], self.conversation_id)
                                return event_data['fullResponse']
                                
                            elif event_data['type'] == 'error':
                                error = Exception(event_data['error'])
                                if on_error:
                                    on_error(error)
                                raise error
                                
                        except json.JSONDecodeError as e:
                            print(f"JSON decode error: {e}")
            
            return full_response
            
        except requests.exceptions.RequestException as e:
            if on_error:
                on_error(e)
            raise

# Sử dụng
chatbot = ChatbotClient('http://your-server-domain.com')

def on_chunk(chunk, full_text):
    print(f"Chunk: {chunk}")
    print(f"Full so far: {full_text}")

def on_complete(full_response, conversation_id):
    print(f"Complete: {full_response}")
    print(f"Conversation ID: {conversation_id}")

def on_error(error):
    print(f"Error: {error}")

# Gửi tin nhắn
response = chatbot.send_message(
    'Bảo hiểm xe máy là gì?',
    user_id='user-123',
    on_chunk=on_chunk,
    on_complete=on_complete,
    on_error=on_error
)
```

---

### 3. Java (Spring Boot)

```java
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class ChatbotClient {
    private String baseUrl;
    private String conversationId = "";
    private ObjectMapper objectMapper = new ObjectMapper();
    
    public ChatbotClient(String baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    public String sendMessage(String message, String userId) throws Exception {
        URL url = new URL(baseUrl + "/api/chat");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);
        connection.setDoInput(true);
        
        // Request body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("message", message);
        requestBody.put("conversationId", conversationId);
        requestBody.put("userId", userId);
        
        String jsonBody = objectMapper.writeValueAsString(requestBody);
        connection.getOutputStream().write(jsonBody.getBytes(StandardCharsets.UTF_8));
        
        // Read response stream
        BufferedReader reader = new BufferedReader(
            new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8)
        );
        
        StringBuilder fullResponse = new StringBuilder();
        String line;
        
        while ((line = reader.readLine()) != null) {
            if (line.startsWith("data: ")) {
                String jsonData = line.substring(6);
                Map<String, Object> data = objectMapper.readValue(jsonData, Map.class);
                
                String type = (String) data.get("type");
                
                if ("chunk".equals(type)) {
                    String content = (String) data.get("content");
                    fullResponse.append(content);
                    // Callback on chunk
                    onChunk(content, fullResponse.toString());
                    
                } else if ("end".equals(type)) {
                    conversationId = (String) data.get("conversationId");
                    String fullResponseText = (String) data.get("fullResponse");
                    // Callback on complete
                    onComplete(fullResponseText, conversationId);
                    return fullResponseText;
                    
                } else if ("error".equals(type)) {
                    String error = (String) data.get("error");
                    throw new Exception(error);
                }
            }
        }
        
        return fullResponse.toString();
    }
    
    // Callbacks - override these
    protected void onChunk(String chunk, String fullText) {
        // Override to handle chunks
    }
    
    protected void onComplete(String fullResponse, String conversationId) {
        // Override to handle completion
    }
}

// Sử dụng
ChatbotClient chatbot = new ChatbotClient("http://your-server-domain.com") {
    @Override
    protected void onChunk(String chunk, String fullText) {
        System.out.println("Chunk: " + chunk);
    }
    
    @Override
    protected void onComplete(String fullResponse, String conversationId) {
        System.out.println("Complete: " + fullResponse);
    }
};

String response = chatbot.sendMessage("Bảo hiểm xe máy là gì?", "user-123");
```

---

### 4. PHP

```php
<?php

class ChatbotClient {
    private $baseUrl;
    private $conversationId = '';
    
    public function __construct($baseUrl) {
        $this->baseUrl = $baseUrl;
    }
    
    public function sendMessage($message, $userId = '') {
        $url = $this->baseUrl . '/api/chat';
        
        $data = [
            'message' => $message,
            'conversationId' => $this->conversationId,
            'userId' => $userId
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) {
            $this->handleStreamData($data);
            return strlen($data);
        });
        
        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP Error: $httpCode");
        }
    }
    
    private function handleStreamData($data) {
        $lines = explode("\n", $data);
        
        foreach ($lines as $line) {
            if (strpos($line, 'data: ') === 0) {
                $json = substr($line, 6);
                $event = json_decode($json, true);
                
                if ($event['type'] === 'chunk') {
                    $this->onChunk($event['content'], $event['conversationId']);
                } elseif ($event['type'] === 'end') {
                    $this->conversationId = $event['conversationId'];
                    $this->onComplete($event['fullResponse'], $event['conversationId']);
                } elseif ($event['type'] === 'error') {
                    $this->onError($event['error']);
                }
            }
        }
    }
    
    // Override these methods
    protected function onChunk($chunk, $conversationId) {
        // Handle chunk
    }
    
    protected function onComplete($fullResponse, $conversationId) {
        // Handle completion
    }
    
    protected function onError($error) {
        // Handle error
    }
}

// Sử dụng
$chatbot = new class('http://your-server-domain.com') extends ChatbotClient {
    protected function onChunk($chunk, $conversationId) {
        echo "Chunk: $chunk\n";
    }
    
    protected function onComplete($fullResponse, $conversationId) {
        echo "Complete: $fullResponse\n";
        echo "Conversation ID: $conversationId\n";
    }
    
    protected function onError($error) {
        echo "Error: $error\n";
    }
};

$chatbot->sendMessage('Bảo hiểm xe máy là gì?', 'user-123');
```

---

### 5. Go

```go
package main

import (
    "bufio"
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "strings"
)

type ChatbotClient struct {
    BaseURL        string
    ConversationID string
}

type ChatRequest struct {
    Message        string `json:"message"`
    ConversationID string `json:"conversationId"`
    UserID         string `json:"userId"`
}

type ChatEvent struct {
    Type           string `json:"type"`
    Content        string `json:"content"`
    ConversationID string `json:"conversationId"`
    FullResponse   string `json:"fullResponse"`
    Error          string `json:"error"`
}

func NewChatbotClient(baseURL string) *ChatbotClient {
    return &ChatbotClient{BaseURL: baseURL}
}

func (c *ChatbotClient) SendMessage(message, userID string) error {
    url := c.BaseURL + "/api/chat"
    
    reqBody := ChatRequest{
        Message:        message,
        ConversationID: c.ConversationID,
        UserID:         userID,
    }
    
    jsonData, err := json.Marshal(reqBody)
    if err != nil {
        return err
    }
    
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    scanner := bufio.NewScanner(resp.Body)
    var fullResponse strings.Builder
    
    for scanner.Scan() {
        line := scanner.Text()
        if strings.HasPrefix(line, "data: ") {
            jsonData := line[6:]
            var event ChatEvent
            if err := json.Unmarshal([]byte(jsonData), &event); err != nil {
                continue
            }
            
            switch event.Type {
            case "chunk":
                fullResponse.WriteString(event.Content)
                c.OnChunk(event.Content, fullResponse.String())
                
            case "end":
                c.ConversationID = event.ConversationID
                c.OnComplete(event.FullResponse, event.ConversationID)
                return nil
                
            case "error":
                c.OnError(event.Error)
                return fmt.Errorf(event.Error)
            }
        }
    }
    
    return scanner.Err()
}

// Override these methods
func (c *ChatbotClient) OnChunk(chunk, fullText string) {
    fmt.Printf("Chunk: %s\n", chunk)
}

func (c *ChatbotClient) OnComplete(fullResponse, conversationID string) {
    fmt.Printf("Complete: %s\n", fullResponse)
    fmt.Printf("Conversation ID: %s\n", conversationID)
}

func (c *ChatbotClient) OnError(error string) {
    fmt.Printf("Error: %s\n", error)
}

// Sử dụng
func main() {
    client := NewChatbotClient("http://your-server-domain.com")
    err := client.SendMessage("Bảo hiểm xe máy là gì?", "user-123")
    if err != nil {
        fmt.Printf("Error: %v\n", err)
    }
}
```

---

## 📋 Checklist cho backend team

- [ ] Đã nhận được Base URL của API server
- [ ] Đã đọc tài liệu API (`API_DOCUMENTATION.md`)
- [ ] Đã test endpoint `/api/health`
- [ ] Đã test endpoint `/api/chat` với ví dụ code
- [ ] Đã implement xử lý SSE stream
- [ ] Đã implement lưu `conversationId` để duy trì ngữ cảnh
- [ ] Đã implement error handling
- [ ] Đã test với các trường hợp lỗi

---

**Lưu ý:** Thay `http://your-server-domain.com` bằng URL thực tế của server chatbot.

