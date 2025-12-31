import { query, queryOne, execute } from '../db.js'
import crypto from 'crypto'

// Generate UUID
function generateId() {
  return crypto.randomUUID()
}

// Find upload by ID
export async function findById(id) {
  return queryOne('SELECT * FROM uploads WHERE id = ?', [id])
}

// Create upload record
export async function create({ userId, userName, bookName, fileName, filePath, fileSize }) {
  const id = generateId()
  
  await execute(
    `INSERT INTO uploads (id, user_id, user_name, book_name, file_name, file_path, file_size) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, userName, bookName, fileName, filePath, fileSize || 0]
  )
  
  return findById(id)
}

// Update upload status
export async function updateStatus(id, status, reviewedBy, adminNotes = null) {
  return execute(
    `UPDATE uploads SET 
      status = ?, 
      reviewed_by = ?, 
      admin_notes = ?,
      reviewed_at = NOW()
    WHERE id = ?`,
    [status, reviewedBy, adminNotes, id]
  )
}

// Get uploads by user
export async function findByUser(userId, limit = 10) {
  return query(
    'SELECT * FROM uploads WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  )
}

// Get all uploads (for admin)
export async function findAll(status = null) {
  if (status) {
    return query(
      'SELECT * FROM uploads WHERE status = ? ORDER BY created_at DESC',
      [status]
    )
  }
  return query('SELECT * FROM uploads ORDER BY created_at DESC')
}

// Get pending uploads count
export async function countPending() {
  const result = await queryOne("SELECT COUNT(*) as count FROM uploads WHERE status = 'pending'")
  return result.count
}

// Delete upload
export async function remove(id) {
  return execute('DELETE FROM uploads WHERE id = ?', [id])
}
