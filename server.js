const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6490;

// Cấu hình API FISS
const FISS_BASE_URL = process.env.FISS_BASE_URL || 'http://api.thegioiaiagent.online';
const FISS_API_URL = process.env.FISS_API_URL || `${FISS_BASE_URL}/v1/chat-messages`;
const FISS_API_KEY = process.env.FISS_API_KEY || 'app-Pt0aXTFxOM650QpcFSrA7CCn';
const FISS_WORKFLOW_ID = process.env.FISS_WORKFLOW_ID || '561bd084-a397-4f2b-a3de-91255b6d2f6c';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lưu trữ tạm thời các cuộc trò chuyện (trong sản xuất bạn sẽ dùng cơ sở dữ liệu)
const conversations = new Map();

// Hàm tạo ID duy nhất
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Route chính
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route kiểm tra trạng thái máy chủ
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Route gửi tin nhắn đến chatbot
app.options('/api/chat', (req, res) => {
    res.status(200).end();
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationId, userId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: 'Tin nhắn không được để trống'
            });
        }

        // Tạo hoặc sử dụng conversationId hiện có
        let currentConversationId = conversationId;
        if (!currentConversationId) {
            currentConversationId = generateId();
            conversations.set(currentConversationId, {
                id: currentConversationId,
                userId: userId || 'web-user-' + generateId(),
                messages: [],
                createdAt: new Date()
            });
        }

        // Thêm tin nhắn của người dùng vào lịch sử
        const conversation = conversations.get(currentConversationId);
        if (conversation) {
            conversation.messages.push({
                role: 'user',
                content: message.trim(),
                timestamp: new Date()
            });
        }

        // Chuẩn bị dữ liệu cho API FISS
        // Lưu ý: /v1/chat-messages là cho CHAT APP, không hỗ trợ workflow_id
        // workflow_id chỉ dùng cho /v1/workflows/run (workflow app)
        const fissData = {
            query: message.trim(),
            inputs: {},
            response_mode: 'streaming',
            user: userId || 'web-user-' + generateId(),
            conversation_id: conversationId || ''
        };
        
        // Chỉ thêm workflow_id nếu endpoint là workflow (không phải chat-messages)
        if (FISS_API_URL.includes('/workflows/') && FISS_WORKFLOW_ID) {
            fissData.workflow_id = FISS_WORKFLOW_ID;
        }

        // Cấu hình headers
        const headers = {
            'Authorization': `Bearer ${FISS_API_KEY}`,
            'Content-Type': 'application/json'
        };

        // Log request để debug
        if (process.env.NODE_ENV === 'development') {
            console.log('📤 Gửi request đến FISS:', {
                url: FISS_API_URL,
                endpoint_type: FISS_API_URL.includes('/workflows/') ? 'workflow' : 'chat',
                has_workflow_id: !!fissData.workflow_id,
                conversation_id: conversationId || '(mới)'
            });
        }

        // Thực hiện yêu cầu đến FISS
        let response;
        try {
            response = await axios.post(FISS_API_URL, fissData, {
                headers,
                responseType: 'stream',
                timeout: 30000
            });
        } catch (axiosError) {
            if (axiosError.response) {
                const status = axiosError.response.status;
                const statusText = axiosError.response.statusText;
                
                // Đọc error response
                let errorMessage = `Lỗi API FISS: ${status} - ${statusText}`;
                let errorDetails = null;
                
                // Đọc error response (có thể là JSON hoặc text)
                try {
                    if (typeof axiosError.response.data === 'string') {
                        errorDetails = JSON.parse(axiosError.response.data);
                    } else if (Buffer.isBuffer(axiosError.response.data)) {
                        const text = axiosError.response.data.toString();
                        errorDetails = JSON.parse(text);
                    } else if (typeof axiosError.response.data === 'object') {
                        errorDetails = axiosError.response.data;
                    }
                    
                    if (errorDetails) {
                        errorMessage = errorDetails.message || errorDetails.error || errorDetails.detail || errorMessage;
                    }
                } catch (e) {
                    // Không parse được, giữ message mặc định
                    if (axiosError.response.data) {
                        errorDetails = { raw: String(axiosError.response.data) };
                    }
                }
                
                console.error('❌ Lỗi từ FISS API:', {
                    status,
                    statusText,
                    url: FISS_API_URL,
                    workflow_id: FISS_WORKFLOW_ID,
                    errorDetails
                });
                
                res.status(status).json({
                    error: errorMessage,
                    status: status,
                    details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
                });
                return;
            }
            
            // Lỗi network hoặc timeout
            console.error('❌ Lỗi kết nối đến FISS API:', axiosError.message);
            res.status(500).json({
                error: `Lỗi kết nối đến FISS API: ${axiosError.message}`
            });
            return;
        }

        // Cấu hình headers cho streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

        let fullResponse = '';
        let conversationIdFromResponse = currentConversationId;

        // Xử lý stream phản hồi
        let buffer = '';
        response.data.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Giữ lại phần chưa hoàn chỉnh

            for (const line of lines) {
                if (!line.trim()) continue; // Bỏ qua dòng trống
                
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        // Log để debug
                        if (process.env.NODE_ENV === 'development') {
                            console.log('FISS event:', data.event, data);
                        }

                        if (data.event === 'agent_message' || data.event === 'message' || data.event === 'message_file' || data.event === 'node_started' || data.event === 'node_finished') {
                            const answer = data.answer || data.data?.answer || data.output?.answer || '';
                            if (answer) {
                                fullResponse += answer;
                                res.write(`data: ${JSON.stringify({
                                    type: 'chunk',
                                    content: answer,
                                    conversationId: conversationIdFromResponse
                                })}\n\n`);
                            }
                        } else if (data.event === 'message_end' || data.event === 'workflow_finished') {
                            // Cập nhật conversation_id nếu có từ phản hồi
                            if (data.conversation_id) {
                                conversationIdFromResponse = data.conversation_id;
                            }

                            // Thêm phản hồi hoàn chỉnh vào lịch sử
                            const conversation = conversations.get(conversationIdFromResponse);
                            if (conversation) {
                                conversation.messages.push({
                                    role: 'assistant',
                                    content: fullResponse,
                                    timestamp: new Date()
                                });
                            }

                            // Gửi sự kiện kết thúc
                            res.write(`data: ${JSON.stringify({
                                type: 'end',
                                conversationId: conversationIdFromResponse,
                                fullResponse: fullResponse
                            })}\n\n`);
                        } else if (data.event === 'error' || data.event === 'workflow_started') {
                            // Xử lý các event khác
                            if (data.event === 'error') {
                                console.error('Lỗi từ FISS API:', data);
                                res.write(`data: ${JSON.stringify({
                                    type: 'error',
                                    error: data.message || 'Lỗi từ FISS API'
                                })}\n\n`);
                            }
                        }
                    } catch (parseError) {
                        console.warn('Lỗi phân tích chunk phản hồi từ FISS:', parseError, 'Line:', line);
                    }
                } else if (line.trim()) {
                    // Log các dòng không phải SSE format
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Non-SSE line:', line);
                    }
                }
            }
        });

        response.data.on('end', () => {
            res.end();
        });

        response.data.on('error', (error) => {
            console.error('Lỗi stream:', error);
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: 'Lỗi trong stream phản hồi'
            })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error('Lỗi trong /api/chat:', error);

        let errorMessage = 'Lỗi máy chủ nội bộ';
        let statusCode = 500;

        if (error.response) {
            // Lỗi từ API FISS
            statusCode = error.response.status;
            errorMessage = `Lỗi API FISS: ${error.response.status} - ${error.response.statusText}`;
        } else if (error.code === 'ECONNABORTED') {
            // Timeout
            statusCode = 408;
            errorMessage = 'Timeout: Yêu cầu mất quá nhiều thời gian';
        }

        res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Route lấy lịch sử cuộc trò chuyện
app.get('/api/conversation/:conversationId', (req, res) => {
    const { conversationId } = req.params;
    const conversation = conversations.get(conversationId);

    if (!conversation) {
        return res.status(404).json({
            error: 'Không tìm thấy cuộc trò chuyện'
        });
    }

    res.json({
        conversationId: conversation.id,
        messages: conversation.messages,
        createdAt: conversation.createdAt
    });
});

// Route dọn dẹp các cuộc trò chuyện cũ (dọn dẹp mỗi giờ)
setInterval(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [id, conversation] of conversations.entries()) {
        if (conversation.createdAt < oneHourAgo) {
            conversations.delete(id);
        }
    }
    console.log(`Đã dọn dẹp cuộc trò chuyện. Tổng số hoạt động: ${conversations.size}`);
}, 60 * 60 * 1000); // Mỗi giờ

// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
    console.error('Lỗi chưa xử lý:', err);
    res.status(500).json({
        error: 'Lỗi máy chủ nội bộ',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Khởi động máy chủ
const server = app.listen(PORT, () => {
    console.log(`🚀 Máy chủ chatbot đang chạy tại http://localhost:${PORT}`);
    console.log(`📱 Mở trình duyệt của bạn tại http://localhost:${PORT}`);
    console.log(`🔧 Chế độ: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 API FISS: ${FISS_API_URL}`);
    console.log(`🔄 Workflow ID: ${FISS_WORKFLOW_ID}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Cổng ${PORT} đã được sử dụng!`);
        console.error(`💡 Chạy lệnh sau để giải phóng cổng:`);
        console.error(`   lsof -ti:${PORT} | xargs kill -9`);
        console.error(`   hoặc thay đổi PORT trong file .env`);
        process.exit(1);
    } else {
        throw err;
    }
});

// Xử lý tín hiệu để đóng gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Đang đóng máy chủ...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Đang đóng máy chủ...');
    process.exit(0);
});
