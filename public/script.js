// Cấu hình client
const API_BASE_URL = window.location.origin;

// Các phần tử DOM
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const suggestionsGrid = document.getElementById('suggestionsGrid');
const suggestionsContainer = document.getElementById('suggestionsContainer');

// Trạng thái chat
let currentConversationId = '';
let currentUserId = 'web-user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
let isTyping = false;

// Câu hỏi đề xuất mặc định
const defaultSuggestions = [
    'Bảo hiểm xe máy là gì?',
    'Các loại bảo hiểm ô tô',
    'Quyền lợi khi tham gia bảo hiểm',
    'Cách mua bảo hiểm online',
    'Thủ tục bồi thường bảo hiểm',
    'Bảo hiểm bắt buộc và tự nguyện'
];

// Lưu lịch sử cuộc trò chuyện để tạo suggestions
let conversationHistory = [];

// Câu hỏi đề xuất theo chủ đề
const topicSuggestions = {
    'xe máy': [
        'Bảo hiểm xe máy bắt buộc',
        'Mức phí bảo hiểm xe máy',
        'Quyền lợi bảo hiểm xe máy',
        'Thủ tục mua bảo hiểm xe máy'
    ],
    'ô tô': [
        'Bảo hiểm ô tô tự nguyện',
        'Bảo hiểm vật chất xe',
        'Bảo hiểm TNDS ô tô',
        'Mức phí bảo hiểm ô tô'
    ],
    'bảo hiểm': [
        'Các loại bảo hiểm',
        'Quyền lợi bảo hiểm',
        'Thủ tục bồi thường',
        'Cách mua bảo hiểm'
    ],
    'bồi thường': [
        'Thủ tục bồi thường',
        'Hồ sơ bồi thường',
        'Thời gian bồi thường',
        'Mức bồi thường'
    ],
    'mua': [
        'Cách mua bảo hiểm online',
        'Mua bảo hiểm ở đâu',
        'Thủ tục mua bảo hiểm',
        'Giấy tờ cần thiết'
    ]
};

// Hàm tạo suggestions dựa trên nội dung
function generateContextualSuggestions() {
    if (conversationHistory.length === 0) {
        return defaultSuggestions;
    }

    // Lấy câu hỏi và câu trả lời gần nhất
    const lastExchange = conversationHistory[conversationHistory.length - 1];
    const userMessage = lastExchange.user?.toLowerCase() || '';
    const botResponse = lastExchange.bot?.toLowerCase() || '';
    const combinedText = (userMessage + ' ' + botResponse).toLowerCase();

    // Tìm chủ đề liên quan
    const suggestions = new Set();
    
    // Kiểm tra các từ khóa
    for (const [topic, topicSugs] of Object.entries(topicSuggestions)) {
        if (combinedText.includes(topic)) {
            topicSugs.forEach(sug => suggestions.add(sug));
        }
    }

    // Tạo câu hỏi follow-up dựa trên nội dung
    if (suggestions.size < 4) {
        // Tìm các từ khóa quan trọng trong câu trả lời
        const importantWords = ['bảo hiểm', 'xe máy', 'ô tô', 'bồi thường', 'quyền lợi', 
                                'thủ tục', 'mua', 'phí', 'giấy tờ', 'hồ sơ', 'thời gian'];
        const foundKeywords = importantWords.filter(word => botResponse.includes(word));
        
        if (foundKeywords.length > 0) {
            foundKeywords.slice(0, 2).forEach(keyword => {
                if (keyword === 'bảo hiểm') {
                    suggestions.add('Các loại bảo hiểm khác');
                    suggestions.add('Quyền lợi bảo hiểm');
                } else if (keyword === 'xe máy') {
                    suggestions.add('Mức phí bảo hiểm xe máy');
                    suggestions.add('Thủ tục mua bảo hiểm xe máy');
                } else if (keyword === 'ô tô') {
                    suggestions.add('Bảo hiểm ô tô tự nguyện');
                    suggestions.add('Bảo hiểm vật chất xe');
                } else if (keyword === 'bồi thường') {
                    suggestions.add('Hồ sơ bồi thường');
                    suggestions.add('Thời gian bồi thường');
                } else if (keyword === 'mua') {
                    suggestions.add('Cách mua bảo hiểm online');
                    suggestions.add('Giấy tờ cần thiết');
                }
            });
        }
    }

    // Nếu vẫn không đủ, thêm suggestions mặc định
    if (suggestions.size < 4) {
        defaultSuggestions.slice(0, 6 - suggestions.size).forEach(sug => {
            suggestions.add(sug);
        });
    }

    return Array.from(suggestions).slice(0, 6);
}

// Hàm tạo ID duy nhất cho tin nhắn
function generateMessageId() {
    return 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Hàm escape HTML an toàn
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Hàm xử lý inline formatting (bold, italic, code)
function processInlineFormatting(text) {
    if (!text) return '';
    
    // Đảm bảo text là string và có encoding đúng
    text = String(text);
    
    const placeholders = new Map();
    let placeholderIndex = 0;
    
    // Tạo placeholder unique
    function getPlaceholder(type) {
        const placeholder = `__${type}_${placeholderIndex}__`;
        placeholderIndex++;
        return placeholder;
    }
    
    // Bảo vệ code blocks trước (thêm flag 'u' để hỗ trợ Unicode)
    text = text.replace(/`([^`]+)`/gu, (match, code) => {
        const placeholder = getPlaceholder('CODE');
        placeholders.set(placeholder, `<code>${escapeHtml(code)}</code>`);
        return placeholder;
    });
    
    // Xử lý bold (thêm flag 'u' để hỗ trợ Unicode)
    text = text.replace(/\*\*(.+?)\*\*/gu, (match, bold) => {
        const placeholder = getPlaceholder('BOLD');
        placeholders.set(placeholder, `<strong>${escapeHtml(bold)}</strong>`);
        return placeholder;
    });
    
    // Xử lý italic (sau khi đã xử lý bold, chỉ còn lại single *) - thêm flag 'u'
    text = text.replace(/\*([^*\n]+?)\*/gu, (match, italic) => {
        const placeholder = getPlaceholder('ITALIC');
        placeholders.set(placeholder, `<em>${escapeHtml(italic)}</em>`);
        return placeholder;
    });
    
    // Escape HTML cho phần còn lại
    text = escapeHtml(text);
    
    // Khôi phục placeholders (dùng replace với function để tránh lỗi)
    placeholders.forEach((replacement, placeholder) => {
        // Escape placeholder để tránh conflict
        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(escapedPlaceholder, 'g'), replacement);
    });
    
    return text;
}

// Hàm render markdown
function renderMarkdown(text) {
    if (!text) return '';
    
    const lines = text.split('\n');
    const result = [];
    let inList = false;
    let inParagraph = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Dòng trống
        if (!trimmed) {
            if (inParagraph) {
                result.push('</p>');
                inParagraph = false;
            }
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            continue;
        }
        
        // Headers
        if (trimmed.startsWith('### ')) {
            if (inParagraph) { result.push('</p>'); inParagraph = false; }
            if (inList) { result.push('</ul>'); inList = false; }
            const content = processInlineFormatting(trimmed.substring(4));
            result.push(`<h3>${content}</h3>`);
            continue;
        }
        
        if (trimmed.startsWith('## ')) {
            if (inParagraph) { result.push('</p>'); inParagraph = false; }
            if (inList) { result.push('</ul>'); inList = false; }
            const content = processInlineFormatting(trimmed.substring(3));
            result.push(`<h2>${content}</h2>`);
            continue;
        }
        
        if (trimmed.startsWith('# ')) {
            if (inParagraph) { result.push('</p>'); inParagraph = false; }
            if (inList) { result.push('</ul>'); inList = false; }
            const content = processInlineFormatting(trimmed.substring(2));
            result.push(`<h1>${content}</h1>`);
            continue;
        }
        
        // Lists (thêm flag 'u' để hỗ trợ Unicode)
        const listMatch = trimmed.match(/^(\d+\.\s+|-\s+)(.+)$/u);
        if (listMatch) {
            if (inParagraph) { result.push('</p>'); inParagraph = false; }
            if (!inList) { result.push('<ul>'); inList = true; }
            const content = processInlineFormatting(listMatch[2]);
            result.push(`<li>${content}</li>`);
            continue;
        }
        
        // Đóng list
        if (inList) {
            result.push('</ul>');
            inList = false;
        }
        
        // Paragraph
        if (!inParagraph) {
            result.push('<p>');
            inParagraph = true;
        } else {
            result.push('<br>');
        }
        
        result.push(processInlineFormatting(trimmed));
    }
    
    // Đóng tags
    if (inParagraph) result.push('</p>');
    if (inList) result.push('</ul>');
    
    return result.join('');
}

// Hàm tạo phần tử tin nhắn
function createMessageElement(content, isUser = false, messageId = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    if (messageId) messageDiv.id = messageId;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Render markdown cho bot messages, plain text cho user messages
    if (isUser) {
        messageContent.textContent = content;
    } else {
        messageContent.innerHTML = renderMarkdown(content);
    }

    messageDiv.appendChild(messageContent);
    return messageDiv;
}

// Hàm hiển thị chỉ báo đang nhập
function showTypingIndicator() {
    if (isTyping) return;

    isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';

    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dotsDiv.appendChild(dot);
    }

    typingDiv.appendChild(dotsDiv);
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

// Hàm ẩn chỉ báo đang nhập
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    isTyping = false;
}

// Hàm cuộn xuống cuối
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hàm hiển thị thông báo lỗi
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = '❌ Lỗi: ' + message;
    chatMessages.appendChild(errorDiv);
    scrollToBottom();

    // Xóa thông báo lỗi sau 8 giây
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 8000);
}

// Hàm hiển thị thông báo thành công tạm thời
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = '✅ ' + message;
    chatMessages.appendChild(successDiv);
    scrollToBottom();

    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// Hàm gửi tin nhắn đến backend
async function sendMessage(message) {
    if (!message || !message.trim()) return;

    try {
        // Ẩn suggestions khi bắt đầu gửi
        hideSuggestions();
        
        // Xóa input và vô hiệu hóa
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;

        // Lưu câu hỏi vào lịch sử
        const userMessage = message.trim();
        conversationHistory.push({
            user: userMessage,
            bot: '',
            timestamp: new Date()
        });

        // Thêm tin nhắn của người dùng vào chat
        const userMessageId = generateMessageId();
        const userMessageElement = createMessageElement(userMessage, true, userMessageId);
        chatMessages.appendChild(userMessageElement);
        scrollToBottom();

        // Hiển thị chỉ báo đang nhập
        showTypingIndicator();

        // Tạo phần tử cho phản hồi của bot
        const botMessageId = generateMessageId();
        const botMessageElement = createMessageElement('', false, botMessageId);
        chatMessages.appendChild(botMessageElement);

        // Gửi tin nhắn đến backend sử dụng POST với streaming
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message.trim(),
                conversationId: currentConversationId,
                userId: currentUserId
            })
        });

        if (!response.ok) {
            let errorMessage = `Lỗi HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                console.error('❌ Chi tiết lỗi từ server:', errorData);
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.error) {
                    errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else {
                    errorMessage = JSON.stringify(errorData);
                }
            } catch (e) {
                // Không thể parse JSON, đọc text
                try {
                    const text = await response.text();
                    errorMessage = text || errorMessage;
                } catch (e2) {
                    // Giữ message mặc định
                }
            }
            console.error('❌ Lỗi chi tiết:', errorMessage);
            throw new Error(errorMessage);
        }

        // Kiểm tra content-type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/event-stream')) {
            // Nếu không phải stream, thử đọc JSON response
            try {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Phản hồi không đúng định dạng');
            } catch (e) {
                throw new Error('Máy chủ không trả về stream. Vui lòng kiểm tra lại.');
            }
        }

        // Xử lý streaming response
        const reader = response.body.getReader();
        // Đảm bảo decode với UTF-8 encoding
        const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
        let buffer = '';
        let fullResponse = '';
        let hasReceivedData = false;

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    // Kết thúc stream
                    if (!hasReceivedData && !fullResponse) {
                        showErrorMessage('Không nhận được phản hồi từ máy chủ');
                    }
                    hideTypingIndicator();
                    messageInput.disabled = false;
                    sendButton.disabled = false;
                    messageInput.focus();
                    // Hiển thị lại suggestions sau khi nhận phản hồi
                    setTimeout(() => showSuggestions(), 500);
                    break;
                }

                hasReceivedData = true;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Giữ lại phần chưa hoàn chỉnh

                for (const line of lines) {
                    if (!line.trim()) continue; // Bỏ qua dòng trống
                    
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'chunk') {
                                // Thêm chunk vào phản hồi
                                fullResponse += data.content;
                                botMessageElement.querySelector('.message-content').innerHTML = renderMarkdown(fullResponse);
                                scrollToBottom();
                            } else if (data.type === 'end') {
                                // Kết thúc phản hồi
                                currentConversationId = data.conversationId;
                                
                                // Lưu câu trả lời vào lịch sử
                                if (conversationHistory.length > 0) {
                                    const lastExchange = conversationHistory[conversationHistory.length - 1];
                                    lastExchange.bot = fullResponse;
                                }
                                
                                hideTypingIndicator();
                                messageInput.disabled = false;
                                sendButton.disabled = false;
                                messageInput.focus();
                                // Hiển thị lại suggestions với context mới
                                setTimeout(() => showSuggestions(), 500);
                            } else if (data.type === 'error') {
                                hideTypingIndicator();
                                showErrorMessage(data.error || 'Lỗi không xác định');
                                messageInput.disabled = false;
                                sendButton.disabled = false;
                                messageInput.focus();
                                // Hiển thị lại suggestions khi có lỗi
                                setTimeout(() => showSuggestions(), 500);
                            }
                        } catch (parseError) {
                            console.warn('Lỗi phân tích dữ liệu SSE:', parseError, 'Line:', line);
                        }
                    } else if (line.trim() && process.env.NODE_ENV === 'development') {
                        console.log('Non-SSE line:', line);
                    }
                }
            }
        } catch (streamError) {
            console.error('Lỗi đọc stream:', streamError);
            hideTypingIndicator();
            showErrorMessage('Lỗi khi đọc phản hồi từ máy chủ: ' + streamError.message);
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
            // Hiển thị lại suggestions khi có lỗi
            setTimeout(() => showSuggestions(), 500);
        }

    } catch (error) {
        console.error('Lỗi trong sendMessage:', error);
        hideTypingIndicator();
        const errorMsg = error.message || 'Lỗi khi gửi tin nhắn. Vui lòng thử lại.';
        showErrorMessage(errorMsg);

        // Kích hoạt lại input
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
        // Hiển thị lại suggestions khi có lỗi
        setTimeout(() => showSuggestions(), 500);
    }
}

// Hàm tạo suggestion card
function createSuggestionCard(text) {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.textContent = text;
    card.addEventListener('click', () => {
        if (!messageInput.disabled) {
            messageInput.value = text;
            messageInput.focus();
            sendMessage(text);
            hideSuggestions();
        }
    });
    return card;
}

// Hàm hiển thị suggestions
function showSuggestions() {
    if (!suggestionsGrid || !suggestionsContainer) return;
    
    // Tạo suggestions dựa trên context
    const suggestions = generateContextualSuggestions();
    
    // Xóa suggestions cũ
    suggestionsGrid.innerHTML = '';
    
    // Tạo cards mới
    suggestions.forEach(suggestion => {
        const card = createSuggestionCard(suggestion);
        suggestionsGrid.appendChild(card);
    });
    
    // Hiển thị container
    suggestionsContainer.style.display = 'block';
}

// Hàm ẩn suggestions
function hideSuggestions() {
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

// Hàm chính để xử lý gửi tin nhắn
function handleSendMessage() {
    const message = messageInput.value.trim();
    if (message && !messageInput.disabled) {
        sendMessage(message);
        hideSuggestions();
    }
}

// Event listeners
sendButton.addEventListener('click', handleSendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// Event listener cho thay đổi input
messageInput.addEventListener('input', () => {
    const hasText = messageInput.value.trim().length > 0;
    sendButton.disabled = !hasText || messageInput.disabled;
    
    // Ẩn suggestions khi người dùng bắt đầu gõ
    if (hasText) {
        hideSuggestions();
    } else {
        // Hiển thị lại suggestions khi input trống
        showSuggestions();
    }
});

// Ẩn suggestions khi focus vào input
messageInput.addEventListener('focus', () => {
    if (messageInput.value.trim().length === 0) {
        showSuggestions();
    }
});

// Hàm kiểm tra kết nối với máy chủ
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        return response.ok && data.status === 'OK';
    } catch (error) {
        return false;
    }
}

// Hàm hiển thị trạng thái kết nối
async function showConnectionStatus() {
    try {
        const isConnected = await checkServerConnection();
        if (!isConnected) {
            showErrorMessage('Không thể kết nối với máy chủ. Vui lòng kiểm tra máy chủ có đang chạy trên cổng 3000 không.');
            console.error('❌ Kiểm tra kết nối thất bại');
        } else {
            console.log('✅ Kết nối với máy chủ thành công');
        }
    } catch (error) {
        showErrorMessage('Lỗi khi kiểm tra kết nối máy chủ.');
        console.error('❌ Lỗi kiểm tra kết nối:', error);
    }
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', async () => {
    messageInput.focus();
    sendButton.disabled = true;

    // Kiểm tra kết nối khi tải
    await showConnectionStatus();
    
    // Hiển thị suggestions ban đầu
    showSuggestions();
});

// Ngăn zoom trên di động khi nhấn đúp
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
