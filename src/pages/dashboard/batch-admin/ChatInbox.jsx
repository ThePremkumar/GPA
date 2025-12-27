/**
 * Batch Admin Chat Inbox
 * View and respond to student messages in assigned batch + Start new conversations
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
  RefreshCw,
  Plus,
  X,
  Users,
  GraduationCap
} from 'lucide-react';
import { 
  subscribeToUserChats, 
  subscribeToMessages, 
  sendMessage,
  markMessagesAsRead,
  initiateAdminChat
} from '../../../services/chatService';
import { rtdb } from '../../../firebase/config';
import { ref, get } from 'firebase/database';

export default function BatchAdminChatInbox() {
  const { currentUser, userData } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  
  // New Message Modal State
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [batchStudents, setBatchStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [sendingNewChat, setSendingNewChat] = useState(false);
  
  const batchAdminId = currentUser?.uid;
  const assignedBatch = userData?.assignedBatch || userData?.assignedYear;
  
  // Subscribe to chats list for this batch admin
  useEffect(() => {
    if (!batchAdminId) return;
    
    const unsubscribe = subscribeToUserChats(batchAdminId, (chatsList) => {
      setChats(chatsList);
    });
    
    return () => unsubscribe();
  }, [batchAdminId]);
  
  // Subscribe to selected chat messages
  useEffect(() => {
    if (!selectedChat || !batchAdminId) return;
    
    const unsubscribe = subscribeToMessages(batchAdminId, selectedChat.recipientId, (msgs) => {
      setMessages(msgs);
    });
    
    // Mark messages as read
    markMessagesAsRead(batchAdminId, selectedChat.chatId);
    
    return () => unsubscribe();
  }, [selectedChat, batchAdminId]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load students from assigned batch when modal opens
  useEffect(() => {
    if (showNewMessageModal && batchStudents.length === 0) {
      loadBatchStudents();
    }
  }, [showNewMessageModal]);
  
  async function loadBatchStudents() {
    if (!assignedBatch) return;
    
    setLoadingStudents(true);
    try {
      const studentsRef = ref(rtdb, 'students');
      const snapshot = await get(studentsRef);
      
      if (snapshot.exists()) {
        const students = [];
        Object.entries(snapshot.val()).forEach(([id, student]) => {
          // Filter only students from assigned batch
          if (student.batch === assignedBatch) {
            students.push({
              id,
              uid: student.uid || id,
              name: student.fullName || student.name || 'Unknown',
              email: student.email || student.authEmail,
              role: 'student',
              batch: student.batch,
              regulation: student.regulation,
              regNum: student.registerNumber || student.regNum
            });
          }
        });
        
        // Sort by name
        students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setBatchStudents(students);
      }
    } catch (error) {
      console.error('Failed to load batch students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }
  
  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedChat) return;
    
    setSending(true);
    try {
      await sendMessage({
        senderId: batchAdminId,
        senderName: userData?.fullName || 'Batch Admin',
        senderEmail: userData?.email || currentUser.email,
        senderRole: 'batch_admin',
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
  
  async function handleStartNewChat(e) {
    e.preventDefault();
    if (!selectedStudent || !initialMessage.trim()) return;
    
    setSendingNewChat(true);
    try {
      const result = await initiateAdminChat({
        recipientId: selectedStudent.uid || selectedStudent.id,
        recipientName: selectedStudent.name,
        recipientEmail: selectedStudent.email,
        recipientRole: 'student',
        adminId: batchAdminId,
        adminName: userData?.fullName || 'Batch Admin',
        message: initialMessage.trim()
      });
      
      // Close modal and select the new chat
      setShowNewMessageModal(false);
      setSelectedStudent(null);
      setInitialMessage('');
      setStudentSearchTerm('');
      
      // Set the new chat as selected
      if (result.chat) {
        setSelectedChat(result.chat);
      }
    } catch (error) {
      console.error('Failed to start new chat:', error);
    } finally {
      setSendingNewChat(false);
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
  
  const filteredStudents = batchStudents.filter(student => {
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.regNum?.toLowerCase().includes(searchLower)
    );
  });
  
  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread || 0), 0);

  return (
    <div className="chat-inbox">
      {/* Header */}
      <div className="inbox-header">
        <div>
          <h1>Messages</h1>
          <p>{chats.length} conversations • {totalUnread} unread • Batch {assignedBatch}</p>
        </div>
        <button 
          className="new-message-btn"
          onClick={() => setShowNewMessageModal(true)}
        >
          <Plus size={18} />
          New Message
        </button>
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
                <p>Click "New Message" to start a conversation with students in your batch</p>
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
                      className={`message ${msg.senderId === batchAdminId ? 'sent' : 'received'}`}
                    >
                      <div className="message-bubble">
                        <p>{msg.message}</p>
                        <div className="message-meta">
                          <span>{formatMessageTime(msg.timestamp)}</span>
                          {msg.senderId === batchAdminId && (
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
              <p>Choose a chat from the list or start a new message</p>
            </div>
          )}
        </div>
      </div>
      
      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="modal-overlay" onClick={() => setShowNewMessageModal(false)}>
          <div className="new-message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Message Student</h2>
              <button className="close-btn" onClick={() => setShowNewMessageModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            {!selectedStudent ? (
              <>
                {/* Student Search */}
                <div className="modal-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search students by name, email, or register number..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                
                {/* Student List */}
                <div className="users-list">
                  {loadingStudents ? (
                    <div className="loading-users">
                      <div className="spinner" />
                      <p>Loading students from Batch {assignedBatch}...</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="no-users">
                      <Users size={40} />
                      <p>{studentSearchTerm ? 'No students found' : `No students in Batch ${assignedBatch}`}</p>
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="user-item"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="user-avatar">
                          <GraduationCap size={18} />
                        </div>
                        <div className="user-info">
                          <div className="user-name">{student.name}</div>
                          <div className="user-details">
                            {student.email}
                            {student.regNum && <span> • {student.regNum}</span>}
                          </div>
                        </div>
                        <div className="user-role student">
                          Student
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Selected Student */}
                <div className="selected-user-card">
                  <button className="back-btn-small" onClick={() => setSelectedStudent(null)}>
                    <ArrowLeft size={16} />
                  </button>
                  <div className="selected-user-info">
                    <div className="selected-user-avatar">
                      {selectedStudent.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div>
                      <div className="selected-user-name">{selectedStudent.name}</div>
                      <div className="selected-user-email">{selectedStudent.email}</div>
                    </div>
                  </div>
                </div>
                
                {/* Compose Message */}
                <form className="compose-form" onSubmit={handleStartNewChat}>
                  <textarea
                    placeholder="Type your message..."
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    className="send-btn"
                    disabled={!initialMessage.trim() || sendingNewChat}
                  >
                    {sendingNewChat ? (
                      <>
                        <div className="spinner-small" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        .chat-inbox {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 120px);
        }
        
        .inbox-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
        
        .new-message-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .new-message-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
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
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .new-message-modal {
          background: var(--bg-secondary);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 560px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: scaleIn 0.2s ease;
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 20px;
        }
        
        .close-btn {
          background: rgba(255,255,255,0.05);
          border: none;
          border-radius: 10px;
          padding: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .close-btn:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }
        
        .modal-search {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: var(--text-secondary);
        }
        
        .modal-search input {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }
        
        .users-list {
          flex: 1;
          overflow-y: auto;
          min-height: 300px;
          max-height: 400px;
        }
        
        .loading-users, .no-users {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-secondary);
          gap: 12px;
        }
        
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .user-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        
        .user-item:hover {
          background: rgba(59, 130, 246, 0.1);
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          background: rgba(59, 130, 246, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
        }
        
        .user-info {
          flex: 1;
          min-width: 0;
        }
        
        .user-name {
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .user-details {
          font-size: 12px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .user-role {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        
        .user-role.student {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .selected-user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(59, 130, 246, 0.05);
        }
        
        .back-btn-small {
          background: rgba(255,255,255,0.05);
          border: none;
          border-radius: 8px;
          padding: 8px;
          color: var(--text-secondary);
          cursor: pointer;
        }
        
        .back-btn-small:hover {
          background: rgba(255,255,255,0.1);
        }
        
        .selected-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .selected-user-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 18px;
        }
        
        .selected-user-name {
          font-weight: 600;
          font-size: 15px;
        }
        
        .selected-user-email {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .compose-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .compose-form textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 16px;
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          resize: none;
          outline: none;
        }
        
        .compose-form textarea:focus {
          border-color: #3b82f6;
        }
        
        .send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }
        
        .send-btn:disabled {
          opacity: 0.6;
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
          
          .new-message-btn span {
            display: none;
          }
          
          .new-message-modal {
            max-height: 90vh;
          }
        }
      `}</style>
    </div>
  );
}
