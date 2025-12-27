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

/**
 * Get all users that admin can message (students + batch admins)
 */
export async function getAllMessageableUsers() {
  try {
    const users = [];
    
    // Get all students
    const studentsSnap = await get(ref(rtdb, 'students'));
    if (studentsSnap.exists()) {
      Object.entries(studentsSnap.val()).forEach(([id, student]) => {
        users.push({
          id,
          uid: student.uid || id,
          name: student.fullName || student.name || 'Unknown',
          email: student.email || student.authEmail,
          role: 'student',
          batch: student.batch,
          regulation: student.regulation,
          regNum: student.registerNumber || student.regNum
        });
      });
    }
    
    // Get all batch admins
    const adminsSnap = await get(ref(rtdb, 'admins'));
    if (adminsSnap.exists()) {
      Object.entries(adminsSnap.val()).forEach(([id, admin]) => {
        if (admin.role === 'batch_admin' || admin.role === 'year_admin') {
          users.push({
            id,
            uid: admin.uid || id,
            name: admin.fullName || admin.name || 'Unknown',
            email: admin.email,
            role: admin.role,
            batch: admin.batch
          });
        }
      });
    }
    
    // Sort by name
    users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    return users;
  } catch (error) {
    console.error('Error fetching messageable users:', error);
    throw error;
  }
}

/**
 * Initiate a new chat from admin to any user
 */
export async function initiateAdminChat({ 
  recipientId,
  recipientName,
  recipientEmail,
  recipientRole,
  adminId = 'admin',
  adminName = 'Admin Support',
  message 
}) {
  try {
    const chatId = adminId < recipientId ? `${adminId}_${recipientId}` : `${recipientId}_${adminId}`;
    const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);
    
    const messageData = {
      senderId: adminId,
      senderName: adminName,
      senderEmail: 'admin@cgpa.app',
      senderRole: 'super_admin',
      receiverId: recipientId,
      message,
      timestamp: Date.now(),
      read: false
    };
    
    await set(newMessageRef, messageData);
    
    // Update chat metadata
    await update(ref(rtdb, `chats/${chatId}`), {
      lastMessage: message,
      lastMessageTime: Date.now(),
      lastSenderId: adminId,
      participants: { [adminId]: true, [recipientId]: true }
    });
    
    // Update admin's chat list
    await set(ref(rtdb, `user_chats/${adminId}/${chatId}`), {
      recipientId: recipientId,
      recipientName: recipientName,
      recipientEmail: recipientEmail,
      recipientRole: recipientRole,
      lastMessage: message,
      lastMessageTime: Date.now(),
      unread: 0
    });
    
    // Update recipient's chat list with unread count
    const recipientChatRef = ref(rtdb, `user_chats/${recipientId}/${chatId}`);
    const recipientChatSnap = await get(recipientChatRef);
    const currentUnread = recipientChatSnap.exists() ? (recipientChatSnap.val().unread || 0) : 0;
    
    await set(recipientChatRef, {
      recipientId: adminId,
      recipientName: 'Admin Support',
      lastMessage: message,
      lastMessageTime: Date.now(),
      unread: currentUnread + 1
    });
    
    return { 
      success: true, 
      chatId, 
      messageId: newMessageRef.key,
      chat: {
        chatId,
        recipientId,
        recipientName,
        recipientEmail,
        lastMessage: message,
        lastMessageTime: Date.now(),
        unread: 0
      }
    };
  } catch (error) {
    console.error('Error initiating admin chat:', error);
    throw error;
  }
}
