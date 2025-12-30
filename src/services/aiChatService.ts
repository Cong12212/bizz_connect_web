import axios from 'axios';

const API_URL = 'http://localhost:8000/api/guides/generate';

export interface AIResponse {
    content: string;
}

export const aiChatService = {
    generateResponse: async (topic: string): Promise<string> => {
        try {
            const response = await axios.post<AIResponse>(API_URL, {
                topic,
            });
            return response.data.content || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
        } catch (error) {
            throw new Error('Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau.');
        }
    },
};
