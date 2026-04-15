import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatWidget.css';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: 'Hello! How can I help you with your RainShield insurance today?', isBot: true }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const handleExternalToggle = () => setIsOpen(prev => !prev);
        window.addEventListener('toggleChat', handleExternalToggle);
        return () => window.removeEventListener('toggleChat', handleExternalToggle);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg = { text: inputText, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const shieldUser = JSON.parse(localStorage.getItem('shield_user') || '{}');
            const response = await axios.post('http://localhost:5000/api/chat/message', {
                sender: 'user-' + (shieldUser._id || 'guest'),
                message: inputText,
                userContext: {
                    name: shieldUser.name,
                    tier: shieldUser.tier,
                    city: shieldUser.city
                }
            });

            if (response.data && response.data.responses) {
                const botMsgs = response.data.responses.map(r => ({ text: r.text, isBot: true }));
                setMessages(prev => [...prev, ...botMsgs]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { text: 'Sorry, I am having trouble connecting. Please try again later.', isBot: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-widget-container">
            {/* Floating Toggle Button */}
            <button 
                className={`chat-toggle-btn ${isOpen ? 'open' : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h3>RainShield Help</h3>
                        <p>Real-time Policy Support</p>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.isBot ? 'bot' : 'user'}`}>
                                <div className="message-bubble">
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message bot">
                                <div className="message-bubble loading">
                                    <span>.</span><span>.</span><span>.</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestions Menu */}
                    <div className="quick-actions">
                        <button onClick={() => setInputText('What is my policy?')}>📋 Policy</button>
                        <button onClick={() => setInputText('Am I eligible for payout?')}>💰 Payout</button>
                        <button onClick={() => setInputText('How to claim?')}>🛡️ Claim</button>
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <input 
                            type="text" 
                            placeholder="Type in English or Hindi..." 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button type="submit" disabled={isLoading}>➤</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
