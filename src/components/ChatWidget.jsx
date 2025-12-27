/**
 * Student Chat Widget - Floating chat button and window
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { sendMessage, subscribeToMessages, markMessagesAsRead } from '../services/chatService';

export default function ChatWidget() {
  const { currentUser, userData, userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  const isStudent = userRole === 'student';
  const chatPartnerId = 'admin';
  
  useEffect(() => {
    if (!currentUser || !isStudent) return;
    
    const unsubscribe = subscribeToMessages(currentUser.uid, chatPartnerId, (msgs) => {
      setMessages(msgs);
    });
    
    return () => unsubscribe();
  }, [currentUser, isStudent]);
  
  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    // Mark messages as read when chat is open
    if (isOpen && currentUser) {
      const chatId = currentUser.uid < chatPartnerId 
        ? `${currentUser.uid}_${chatPartnerId}` 
        : `${chatPartnerId}_${currentUser.uid}`;
      markMessagesAsRead(currentUser.uid, chatId);
    }
  }, [isOpen, currentUser, messages]);
  
  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim() || sending) return;
    
    setSending(true);
    try {
      await sendMessage({
        senderId: currentUser.uid,
        senderName: userData?.fullName || userData?.name || 'Student',
        senderEmail: userData?.email || currentUser.email,
        senderRole: 'student',
        receiverId: chatPartnerId,
        message: message.trim()
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }
  
  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  
  // Only show for students
  if (!isStudent || !currentUser) return null;
  
  const unreadCount = messages.filter(m => m.senderId !== currentUser.uid && !m.read).length;
  
  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <MessageCircle size={20} />
              </div>
              <div>
                <h4>Admin Support</h4>
                <span className="chat-status">Online</span>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              <Minimize2 size={18} />
            </button>
          </div>
          
          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <MessageCircle size={40} />
                <p>Start a conversation with Admin</p>
                <span>We're here to help!</span>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`chat-message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}
                >
                  <div className="message-bubble">
                    <p>{msg.message}</p>
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <form className="chat-input" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
            />
            <button type="submit" disabled={!message.trim() || sending}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
      
      {/* Floating Button */}
      <button 
        className={`chat-fab ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && unreadCount > 0 && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>
      
      <style>{`
        .chat-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 1000;
        }
        
        .chat-fab:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 25px rgba(59, 130, 246, 0.5);
        }
        
        .chat-fab.active {
          background: #ef4444;
        }
        
        .chat-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 22px;
          height: 22px;
          background: #ef4444;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-primary);
        }
        
        .chat-window {
          position: fixed;
          bottom: 90px;
          right: 24px;
          width: 360px;
          height: 480px;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1000;
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
        }
        
        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chat-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chat-header h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
        }
        
        .chat-status {
          font-size: 12px;
          opacity: 0.8;
        }
        
        .chat-close {
          background: rgba(255,255,255,0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--text-secondary);
          gap: 8px;
        }
        
        .chat-empty p {
          margin: 8px 0 0;
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .chat-empty span {
          font-size: 13px;
        }
        
        .chat-message {
          display: flex;
        }
        
        .chat-message.sent {
          justify-content: flex-end;
        }
        
        .chat-message.received {
          justify-content: flex-start;
        }
        
        .message-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 16px;
          position: relative;
        }
        
        .chat-message.sent .message-bubble {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .chat-message.received .message-bubble {
          background: rgba(255,255,255,0.08);
          border-bottom-left-radius: 4px;
        }
        
        .message-bubble p {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
          word-break: break-word;
        }
        
        .message-time {
          display: block;
          font-size: 10px;
          margin-top: 4px;
          opacity: 0.7;
          text-align: right;
        }
        
        .chat-input {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
        }
        
        .chat-input input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 10px 16px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }
        
        .chat-input input:focus {
          border-color: #3b82f6;
        }
        
        .chat-input button {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }
        
        .chat-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        @media (max-width: 480px) {
          .chat-window {
            width: calc(100% - 32px);
            right: 16px;
            bottom: 80px;
            height: 60vh;
          }
          
          .chat-fab {
            bottom: 16px;
            right: 16px;
          }
        }
      `}</style>
    </>
  );
}
