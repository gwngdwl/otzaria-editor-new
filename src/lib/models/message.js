import { query, queryOne, execute, insert } from '../db.js'

// Find message by ID
export async function findById(id) {
  const message = await queryOne('SELECT * FROM messages WHERE id = ?', [id])
  if (message) {
    message.replies = await getReplies(id)
  }
  return message
}

// Create message
export async function create({ senderId, senderName, recipientId, subject, message, isAdminMessage = false }) {
  const id = await insert(
    `INSERT INTO messages (sender_id, sender_name, recipient_id, subject, message, is_admin_message) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [senderId, senderName, recipientId || null, subject, message, isAdminMessage]
  )
  return findById(id)
}

// Send message to all users (admin broadcast)
export async function broadcast(senderId, senderName, subject, message, userIds) {
  const values = userIds.map(userId => [senderId, senderName, userId, subject, message, true])
  const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')
  const flatValues = values.flat()
  
  await execute(
    `INSERT INTO messages (sender_id, sender_name, recipient_id, subject, message, is_admin_message) 
     VALUES ${placeholders}`,
    flatValues
  )
}

// Get messages for user
export async function findByUser(userId, isAdmin = false) {
  let messages
  
  if (isAdmin) {
    // Admins see all messages sent to them (from users)
    messages = await query(`
      SELECT * FROM messages 
      WHERE recipient_id IS NULL OR recipient_id = ?
      ORDER BY created_at DESC
    `, [userId])
  } else {
    // Users see messages they sent or received
    messages = await query(`
      SELECT * FROM messages 
      WHERE sender_id = ? OR recipient_id = ?
      ORDER BY created_at DESC
    `, [userId, userId])
  }
  
  // Load replies for each message
  for (const msg of messages) {
    msg.replies = await getReplies(msg.id)
  }
  
  return messages
}

// Get replies for a message
async function getReplies(messageId) {
  return query(
    'SELECT * FROM message_replies WHERE message_id = ? ORDER BY created_at',
    [messageId]
  )
}

// Add reply to message
export async function addReply(messageId, senderId, senderName, message) {
  await insert(
    'INSERT INTO message_replies (message_id, sender_id, sender_name, message) VALUES (?, ?, ?, ?)',
    [messageId, senderId, senderName, message]
  )
  
  // Update message status
  await execute(
    "UPDATE messages SET status = 'replied' WHERE id = ?",
    [messageId]
  )
  
  return findById(messageId)
}

// Mark message as read
export async function markAsRead(id) {
  return execute(
    "UPDATE messages SET status = 'read', read_at = NOW() WHERE id = ?",
    [id]
  )
}

// Delete message
export async function remove(id) {
  return execute('DELETE FROM messages WHERE id = ?', [id])
}

// Count unread messages for user
export async function countUnread(userId, isAdmin = false) {
  let result
  
  if (isAdmin) {
    result = await queryOne(`
      SELECT COUNT(*) as count FROM messages 
      WHERE status = 'unread' AND (recipient_id IS NULL OR recipient_id = ?)
    `, [userId])
  } else {
    result = await queryOne(`
      SELECT COUNT(*) as count FROM messages 
      WHERE status = 'unread' AND recipient_id = ?
    `, [userId])
  }
  
  return result.count
}
