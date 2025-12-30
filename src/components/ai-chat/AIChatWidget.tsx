import React, { useState, useRef } from 'react';
import { useAIChat } from '../../hooks/useAIChat';
import { useDraggable } from '../../hooks/useDraggable';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatButton from './ChatButton';

const AIChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { messages, isLoading, sendMessage } = useAIChat();
    const { position, isDragging, handleMouseDown } = useDraggable({ x: 20, y: 20 });
    const widgetRef = useRef<HTMLDivElement>(null);

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
                onMouseDown={(e) => handleMouseDown(e, '.chat-header')}
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
                        <ChatHeader onClose={() => setIsOpen(false)} />
                        <ChatMessages messages={messages} isLoading={isLoading} />
                        <ChatInput onSend={sendMessage} isLoading={isLoading} />
                    </div>
                ) : (
                    <ChatButton onClick={() => setIsOpen(true)} />
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