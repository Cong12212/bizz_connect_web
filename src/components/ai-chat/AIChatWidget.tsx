import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Message {
    type: 'user' | 'ai';
    text: string;
    timestamp: string;
}

interface Position {
    x: number;
    y: number;
}

const AIChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<HTMLDivElement>(null);
    const API_URL = 'http://localhost:8000/api/guides/generate';

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Dragging handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.chat-header')) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            const maxX = window.innerWidth - 380;
            const maxY = window.innerHeight - (isOpen ? 600 : 60);

            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY)),
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    // Send message
    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage: Message = {
            type: 'user',
            text: inputText,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await axios.post(API_URL, {
                topic: inputText,
            });

            const aiMessage: Message = {
                type: 'ai',
                text: response.data.content || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                type: 'ai',
                text: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau.',
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Overlay khi đang drag */}
            {isDragging && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9998,
                        cursor: 'grabbing',
                    }}
                />
            )}

            {/* Chat Widget */}
            <div
                ref={widgetRef}
                style={{
                    position: 'fixed',
                    bottom: `${position.y}px`,
                    right: `${position.x}px`,
                    zIndex: 9999,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
                onMouseDown={handleMouseDown}
            >
                {isOpen ? (
                    // Chat Window
                    <div
                        style={{
                            width: '380px',
                            height: '600px',
                            backgroundColor: '#fff',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb',
                        }}
                    >
                        {/* Header */}
                        <div
                            className="chat-header"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                padding: '16px 20px',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'grab',
                                userSelect: 'none',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                    }}
                                >
                                    🤖
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '16px' }}>AI Trợ Lý</div>
                                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Luôn sẵn sàng hỗ trợ</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                                ×
                            </button>
                        </div>

                        {/* Messages */}
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

                        {/* Input */}
                        <div
                            style={{
                                padding: '16px 20px',
                                borderTop: '1px solid #e5e7eb',
                                backgroundColor: '#fff',
                            }}
                        >
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Nhập câu hỏi..."
                                    rows={1}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '14px',
                                        resize: 'none',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim() || isLoading}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: inputText.trim() && !isLoading ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Gửi
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Chat Button
                    <button
                        onClick={() => setIsOpen(true)}
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px',
                            transition: 'all 0.3s',
                            animation: 'pulse 2s infinite',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 6px 24px rgba(102, 126, 234, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                        }}
                    >
                        💬
                    </button>
                )}
            </div>

            {/* CSS Animations */}
            <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 4px 24px rgba(102, 126, 234, 0.6); }
        }
      `}</style>
        </>
    );
};

export default AIChatWidget;