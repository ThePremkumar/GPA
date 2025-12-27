/**
 * Super Admin Chat Inbox
 * View and respond to student messages
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  MessageCircle, 
  Send, 
  Search, 
  User, 
  Clock,
  ArrowLeft,
  CheckCheck,
  RefreshCw
} from 'lucide-react';
import { 
  subscribeToUserChats, 
  subscribeToMessages, 
  sendMessage,
  markMessagesAsRead 
} from '../../../services/chatService';

export default function ChatInbox() {
  const { currentUser, userData } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  
  const adminId = 'admin';
  
  // Subscribe to chats list
  useEffect(() => {
    const unsubscribe = subscribeToUserChats(adminId, (chatsList) => {
      setChats(chatsList);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Subscribe to selected chat messages
  useEffect(() => {
    if (!selectedChat) return;
    
    const unsubscribe = subscribeToMessages(adminId, selectedChat.recipientId, (msgs) => {
      setMessages(msgs);
    });
    
    // Mark messages as read
    markMessagesAsRead(adminId, selectedChat.chatId);
    
    return () => unsubscribe();
  }, [selectedChat]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedChat) return;
    
    setSending(true);
    try {
      await sendMessage({
        senderId: adminId,
        senderName: userData?.fullName || 'Admin',
        senderEmail: userData?.email || 'admin@cgpa.app',
        senderRole: 'super_admin',
        receiverId: selectedChat.recipientId,
        message: newMessage.trim()
      });
      setNewMessage('');
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
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  
  function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  
  const filteredChats = chats.filter(chat => 
    chat.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread || 0), 0);

  return (
    <div className="chat-inbox">
      {/* Header */}
      <div className="inbox-header">
        <div>
          <h1>Messages</h1>
          <p>{chats.length} conversations • {totalUnread} unread</p>
        </div>
      </div>
      
      <div className="inbox-container">
        {/* Chat List */}
        <div className={`chat-list ${selectedChat ? 'hidden-mobile' : ''}`}>
          {/* Search */}
          <div className="chat-search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Chats */}
          <div className="chats-container">
            {filteredChats.length === 0 ? (
              <div className="no-chats">
                <MessageCircle size={48} />
                <h3>No messages yet</h3>
                <p>Student messages will appear here</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div 
                  key={chat.chatId} 
                  className={`chat-item ${selectedChat?.chatId === chat.chatId ? 'active' : ''} ${chat.unread > 0 ? 'unread' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-item-avatar">
                    {(chat.recipientName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-header">
                      <span className="chat-item-name">{chat.recipientName || 'Student'}</span>
                      <span className="chat-item-time">{formatTime(chat.lastMessageTime)}</span>
                    </div>
                    <div className="chat-item-preview">
                      <span>{chat.lastMessage}</span>
                      {chat.unread > 0 && (
                        <span className="unread-badge">{chat.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Chat Window */}
        <div className={`chat-window ${selectedChat ? 'active' : ''}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="chat-window-header">
                <button className="back-btn" onClick={() => setSelectedChat(null)}>
                  <ArrowLeft size={20} />
                </button>
                <div className="chat-window-user">
                  <div className="chat-window-avatar">
                    {(selectedChat.recipientName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4>{selectedChat.recipientName || 'Student'}</h4>
                    <span>{selectedChat.recipientEmail}</span>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="chat-window-messages">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages in this conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`message ${msg.senderId === adminId ? 'sent' : 'received'}`}
                    >
                      <div className="message-bubble">
                        <p>{msg.message}</p>
                        <div className="message-meta">
                          <span>{formatMessageTime(msg.timestamp)}</span>
                          {msg.senderId === adminId && (
                            <CheckCheck size={14} className={msg.read ? 'read' : ''} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input */}
              <form className="chat-window-input" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}>
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <MessageCircle size={64} />
              <h3>Select a conversation</h3>
              <p>Choose a chat from the list to view messages</p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .chat-inbox {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 120px);
        }
        
        .inbox-header {
          margin-bottom: 24px;
        }
        
        .inbox-header h1 {
          margin: 0 0 8px;
          font-size: 24px;
        }
        
        .inbox-header p {
          margin: 0;
          color: var(--text-secondary);
        }
        
        .inbox-container {
          flex: 1;
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          min-height: 0;
        }
        
        .chat-list {
          background: var(--bg-secondary);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .chat-search {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: var(--text-secondary);
        }
        
        .chat-search input {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }
        
        .chats-container {
          flex: 1;
          overflow-y: auto;
        }
        
        .no-chats {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px;
          text-align: center;
          color: var(--text-secondary);
        }
        
        .no-chats h3 {
          margin: 16px 0 8px;
        }
        
        .chat-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.2s;
        }
        
        .chat-item:hover {
          background: rgba(255,255,255,0.03);
        }
        
        .chat-item.active {
          background: rgba(59, 130, 246, 0.1);
          border-left: 3px solid #3b82f6;
        }
        
        .chat-item.unread {
          background: rgba(59, 130, 246, 0.05);
        }
        
        .chat-item-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          flex-shrink: 0;
        }
        
        .chat-item-info {
          flex: 1;
          min-width: 0;
        }
        
        .chat-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .chat-item-name {
          font-weight: 500;
        }
        
        .chat-item.unread .chat-item-name {
          font-weight: 600;
        }
        
        .chat-item-time {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .chat-item-preview {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        
        .chat-item-preview span:first-child {
          font-size: 13px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .unread-badge {
          background: #3b82f6;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
          flex-shrink: 0;
        }
        
        .chat-window {
          background: var(--bg-secondary);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .no-chat-selected {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--text-secondary);
        }
        
        .no-chat-selected h3 {
          margin: 16px 0 8px;
          color: var(--text-primary);
        }
        
        .chat-window-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
        }
        
        .back-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          padding: 8px;
          cursor: pointer;
        }
        
        .chat-window-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chat-window-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }
        
        .chat-window-user h4 {
          margin: 0;
          font-size: 15px;
        }
        
        .chat-window-user span {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .chat-window-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .no-messages {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
        
        .message {
          display: flex;
        }
        
        .message.sent {
          justify-content: flex-end;
        }
        
        .message.received {
          justify-content: flex-start;
        }
        
        .message-bubble {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 16px;
        }
        
        .message.sent .message-bubble {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .message.received .message-bubble {
          background: rgba(255,255,255,0.08);
          border-bottom-left-radius: 4px;
        }
        
        .message-bubble p {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .message-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          margin-top: 4px;
        }
        
        .message-meta span {
          font-size: 10px;
          opacity: 0.7;
        }
        
        .message-meta svg {
          opacity: 0.5;
        }
        
        .message-meta svg.read {
          opacity: 1;
          color: #22c55e;
        }
        
        .chat-window-input {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
        }
        
        .chat-window-input input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 12px 20px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }
        
        .chat-window-input input:focus {
          border-color: #3b82f6;
        }
        
        .chat-window-input button {
          width: 44px;
          height: 44px;
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
        
        .chat-window-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .inbox-container {
            grid-template-columns: 1fr;
          }
          
          .chat-list.hidden-mobile {
            display: none;
          }
          
          .chat-window:not(.active) {
            display: none;
          }
          
          .back-btn {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}
