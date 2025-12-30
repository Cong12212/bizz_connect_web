import { useState, useCallback } from 'react';
import { aiChatService } from '../services/aiChatService';

export interface Message {
    type: 'user' | 'ai';
    text: string;
    timestamp: string;
}

export const useAIChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            type: 'user',
            text,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await aiChatService.generateResponse(text);
            const aiMessage: Message = {
                type: 'ai',
                text: response,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                type: 'ai',
                text: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { messages, isLoading, sendMessage };
};
