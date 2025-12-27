/**
 * Chat Service - Real-time messaging with Firebase RTDB
 */

import { rtdb } from '../firebase/config';
import { ref, push, set, get, onValue, update, query, orderByChild, limitToLast } from 'firebase/database';

/**
 * Send a message from user to admin
 */
export async function sendMessage({ 
  senderId, 
  senderName, 
  senderEmail,
  senderRole,
  receiverId = 'admin', // 'admin' for super admin inbox
  message 
}) {
  try {
    const chatId = senderId < receiverId ? `${senderId}_${receiverId}` : `${receiverId}_${senderId}`;
    const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);
    
    const messageData = {
      senderId,
      senderName,
      senderEmail,
      senderRole,
      receiverId,
      message,
      timestamp: Date.now(),
      read: false
    };
    
    await set(newMessageRef, messageData);
    
    // Update chat metadata
    await update(ref(rtdb, `chats/${chatId}`), {
      lastMessage: message,
      lastMessageTime: Date.now(),
      lastSenderId: senderId,
      participants: { [senderId]: true, [receiverId]: true }
    });
    
    // Update user's chat list
    await set(ref(rtdb, `user_chats/${senderId}/${chatId}`), {
      recipientId: receiverId,
      recipientName: 'Admin Support',
      lastMessage: message,
      lastMessageTime: Date.now(),
      unread: 0
    });
    
    // Update admin's chat list with unread count
    const adminChatRef = ref(rtdb, `user_chats/${receiverId}/${chatId}`);
    const adminChatSnap = await get(adminChatRef);
    const currentUnread = adminChatSnap.exists() ? (adminChatSnap.val().unread || 0) : 0;
    
    await set(adminChatRef, {
      recipientId: senderId,
      recipientName: senderName,
      recipientEmail: senderEmail,
      lastMessage: message,
      lastMessageTime: Date.now(),
      unread: currentUnread + 1
    });
    
    return { success: true, messageId: newMessageRef.key };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get chat messages between two users (real-time)
 */
export function subscribeToMessages(userId, recipientId, callback) {
  const chatId = userId < recipientId ? `${userId}_${recipientId}` : `${recipientId}_${userId}`;
  const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
  
  return onValue(messagesRef, (snapshot) => {
    const messages = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        messages.push({
          id: child.key,
          ...child.val()
        });
      });
    }
    // Sort by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);
    callback(messages);
  });
}

/**
 * Get user's chat list (real-time)
 */
export function subscribeToUserChats(userId, callback) {
  const chatsRef = ref(rtdb, `user_chats/${userId}`);
  
  return onValue(chatsRef, (snapshot) => {
    const chats = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        chats.push({
          chatId: child.key,
          ...child.val()
        });
      });
    }
    // Sort by last message time
    chats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
    callback(chats);
  });
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(userId, chatId) {
  try {
    // Mark all messages as read
    const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
    const snapshot = await get(messagesRef);
    
    if (snapshot.exists()) {
      const updates = {};
      snapshot.forEach((child) => {
        const msg = child.val();
        if (msg.receiverId === userId && !msg.read) {
          updates[`${child.key}/read`] = true;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await update(messagesRef, updates);
      }
    }
    
    // Reset unread count
    await update(ref(rtdb, `user_chats/${userId}/${chatId}`), {
      unread: 0
    });
    
    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
}

/**
 * Get total unread count for admin
 */
export function subscribeToUnreadCount(userId, callback) {
  const chatsRef = ref(rtdb, `user_chats/${userId}`);
  
  return onValue(chatsRef, (snapshot) => {
    let totalUnread = 0;
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        totalUnread += child.val().unread || 0;
      });
    }
    callback(totalUnread);
  });
}
