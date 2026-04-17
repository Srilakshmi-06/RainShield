import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, MicOff, Volume2, VolumeX, Send } from 'lucide-react';
import './ChatWidget.css';
import BACKEND_URL from '../config.js';

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: 'Hello! How can I help you with your RainShield insurance today?', isBot: true }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceLanguage, setVoiceLanguage] = useState('en-IN'); // Default to English (India)
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

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

    useEffect(() => {
        if (recognition) {
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = voiceLanguage;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
                setIsListening(false);
                // Optionally auto-send:
                // handleSendMessage(null, transcript);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };
        }
    }, [voiceLanguage]);

    const toggleListening = () => {
        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            if (recognition) {
                recognition.lang = voiceLanguage;
                recognition.start();
                setIsListening(true);
            } else {
                alert('Speech recognition is not supported in this browser.');
            }
        }
    };

    const speak = (text) => {
        if (!window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voiceLanguage;
        
        // Find a suitable voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes(voiceLanguage.split('-')[0]));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const toggleSpeaking = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const handleSendMessage = async (e, overrideText = null) => {
        if (e) e.preventDefault();
        const textToSend = overrideText || inputText;
        if (!textToSend.trim()) return;

        const userMsg = { text: textToSend, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const shieldUser = JSON.parse(localStorage.getItem('shield_user') || '{}');
            const response = await axios.post(`${BACKEND_URL}/api/chat/message`, {
                sender: 'user-' + (shieldUser._id || 'guest'),
                message: textToSend,
                userContext: {
                    name: shieldUser.name,
                    tier: shieldUser.tier,
                    city: shieldUser.city,
                    language: voiceLanguage
                }
            });

            if (response.data && response.data.responses) {
                const botMsgs = response.data.responses.map(r => ({ text: r.text, isBot: true }));
                setMessages(prev => [...prev, ...botMsgs]);
                
                // Speak the first response automatically
                if (botMsgs.length > 0) {
                    speak(botMsgs[0].text);
                }
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

                    {/* Language Toggle & Voice Controls */}
                    <div className="voice-controls">
                        <select 
                            value={voiceLanguage} 
                            onChange={(e) => setVoiceLanguage(e.target.value)}
                            className="lang-select"
                        >
                            <option value="en-IN">English (India)</option>
                            <option value="hi-IN">Hindi (India)</option>
                            <option value="ta-IN">Tamil (India)</option>
                        </select>
                        <button 
                            className={`voice-btn ${isSpeaking ? 'speaking' : ''}`}
                            onClick={toggleSpeaking}
                            title={isSpeaking ? "Stop Speaking" : "Voice Support Active"}
                        >
                            {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <button 
                            type="button" 
                            className={`mic-btn ${isListening ? 'listening' : ''}`}
                            onClick={toggleListening}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <input 
                            type="text" 
                            placeholder={isListening ? "Listening..." : "Type in English or Hindi..."} 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button type="submit" disabled={isLoading} className="send-btn">
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
