import React, { useRef, useEffect } from 'react';
import type { Message } from '../../hooks/useAIChat';

interface ChatMessagesProps {
    messages: Message[];
    isLoading: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div
            style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                backgroundColor: '#f9fafb',
            }}
        >
            {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                        Xin chào! Tôi có thể giúp gì cho bạn?
                    </div>
                    <div style={{ fontSize: '14px' }}>Hãy hỏi tôi về cách sử dụng ứng dụng</div>
                </div>
            ) : (
                messages.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: '16px',
                        }}
                    >
                        <div
                            style={{
                                maxWidth: '75%',
                                padding: '12px 16px',
                                borderRadius: '16px',
                                backgroundColor: msg.type === 'user' ? '#667eea' : '#fff',
                                color: msg.type === 'user' ? '#fff' : '#1f2937',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                wordBreak: 'break-word',
                            }}
                        >
                            <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                {msg.text}
                            </div>
                            <div
                                style={{
                                    fontSize: '11px',
                                    marginTop: '4px',
                                    opacity: 0.7,
                                    textAlign: 'right',
                                }}
                            >
                                {msg.timestamp}
                            </div>
                        </div>
                    </div>
                ))
            )}

            {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                    <div
                        style={{
                            padding: '12px 16px',
                            borderRadius: '16px',
                            backgroundColor: '#fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                    >
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#667eea',
                                        animation: 'bounce 1.4s infinite ease-in-out',
                                        animationDelay: `${i * 0.16}s`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessages;
