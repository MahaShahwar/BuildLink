import React, { useState, useRef, useEffect } from 'react';
import { askAI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AIChatbot.css';

const SUGGESTIONS = [
  'What materials are best for a 5 marla house?',
  'Estimate cost for 10 marla construction in Lahore',
  'What permits do I need for residential construction?',
  'How long does it take to build a 2-story house?',
];

const AIChatbot = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm **BuildLink AI** 🏗️ — your construction advisor for Pakistan. Ask me about costs, materials, regulations, or anything construction-related!" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!user) return null;

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);

    try {
      const res = await askAI(question);
      setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I couldn't process that. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Simple markdown bold rendering
  const renderText = (text) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );
  };

  return (
    <>
      {/* Floating button */}
      <button className={`chatbot-fab ${open ? 'chatbot-fab--open' : ''}`} onClick={() => setOpen(!open)} title="AI Construction Advisor">
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a8 8 0 018 8c0 3.5-2 6-4 7.5V20a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.5C6 16 4 13.5 4 10a8 8 0 018-8z"/>
            <path d="M9 22h6M10 14h.01M14 14h.01M10 17h4" strokeLinecap="round"/>
          </svg>
        )}
        {!open && <span className="chatbot-fab__badge">AI</span>}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chatbot">
          <div className="chatbot__header">
            <div className="chatbot__header-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2a8 8 0 018 8c0 3.5-2 6-4 7.5V20a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.5C6 16 4 13.5 4 10a8 8 0 018-8z"/>
              </svg>
            </div>
            <div>
              <div className="chatbot__header-title">BuildLink AI</div>
              <div className="chatbot__header-status">Construction Advisor • Online</div>
            </div>
          </div>

          <div className="chatbot__messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot__msg chatbot__msg--${msg.role}`}>
                {msg.role === 'ai' && (
                  <div className="chatbot__msg-avatar">🤖</div>
                )}
                <div className="chatbot__msg-bubble">
                  {renderText(msg.text)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chatbot__msg chatbot__msg--ai">
                <div className="chatbot__msg-avatar">🤖</div>
                <div className="chatbot__msg-bubble chatbot__msg-bubble--typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="chatbot__suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="chatbot__suggestion" onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          )}

          <div className="chatbot__input-bar">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about construction..."
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
