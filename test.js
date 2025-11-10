// eslint-disable-next-line @typescript-eslint/no-var-requires
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
        response_mode: 'streaming',
      },
      {
        headers: {
          Authorization: 'Bearer app-Pt0aXTFxOM650QpcFSrA7CCn',
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 120000,  // ✅ Tăng timeout lên 120 giây (2 phút)
      },
    );

    let buffer = '';
    let fullResponse = '';

    return new Promise((resolve, reject) => {
      response.data.on('data', chunk => {
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

console.log('Starting FISS API call...');
callFISSAPI('bảo hiểm là gì?')
  .then(fullResponse => {
    console.log('Full Response:', fullResponse);
  })
  .catch(error => {
    console.error('Error during API call:', error.message);
  });
