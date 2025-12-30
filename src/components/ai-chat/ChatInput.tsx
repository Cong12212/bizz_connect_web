import React, { useState } from 'react';

interface ChatInputProps {
    onSend: (text: string) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
    const [inputText, setInputText] = useState<string>('');

    const handleSend = () => {
        if (inputText.trim()) {
            onSend(inputText);
            setInputText('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
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
                    onClick={handleSend}
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
    );
};

export default ChatInput;
