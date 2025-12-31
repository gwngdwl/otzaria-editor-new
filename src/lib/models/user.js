import { query, queryOne, execute } from '../db.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Generate UUID
function generateId() {
  return crypto.randomUUID()
}

// Find user by ID
export async function findById(id) {
  return queryOne('SELECT * FROM users WHERE id = ?', [id])
}

// Find user by email
export async function findByEmail(email) {
  return queryOne('SELECT * FROM users WHERE email = ?', [email])
}

// Find user by name
export async function findByName(name) {
  return queryOne('SELECT * FROM users WHERE name = ?', [name])
}

// Find user by email or name (for login)
export async function findByIdentifier(identifier) {
  return queryOne(
    'SELECT * FROM users WHERE email = ? OR name = ?',
    [identifier, identifier]
  )
}

// Create new user
export async function create({ email, name, password, role = 'user' }) {
  const id = generateId()
  const passwordHash = await bcrypt.hash(password, 12)
  
  await execute(
    'INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [id, email, name, passwordHash, role]
  )
  
  return findById(id)
}

// Verify password
export async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password_hash)
}

// Update password
export async function updatePassword(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 12)
  return execute(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, id]
  )
}

// Update user
export async function update(id, data) {
  const fields = []
  const values = []
  
  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.email !== undefined) {
    fields.push('email = ?')
    values.push(data.email)
  }
  if (data.role !== undefined) {
    fields.push('role = ?')
    values.push(data.role)
  }
  if (data.points !== undefined) {
    fields.push('points = ?')
    values.push(data.points)
  }
  
  if (fields.length === 0) return 0
  
  values.push(id)
  return execute(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

// Add points to user
export async function addPoints(id, points) {
  return execute(
    'UPDATE users SET points = points + ? WHERE id = ?',
    [points, id]
  )
}

// Delete user
export async function remove(id) {
  return execute('DELETE FROM users WHERE id = ?', [id])
}

// List all users
export async function findAll() {
  return query('SELECT id, email, name, role, points, created_at FROM users ORDER BY created_at DESC')
}

// Count users
export async function count() {
  const result = await queryOne('SELECT COUNT(*) as count FROM users')
  return result.count
}

// Get user stats
export async function getStats(userId) {
  const stats = await queryOne(`
    SELECT 
      COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
    FROM pages 
    WHERE editor_id = ?
  `, [userId])
  
  const user = await findById(userId)
  
  return {
    inProgressPages: stats?.in_progress || 0,
    completedPages: stats?.completed || 0,
    myPages: (stats?.in_progress || 0) + (stats?.completed || 0),
    points: user?.points || 0,
  }
}

// Get user's recent activity
export async function getRecentActivity(userId, limit = 10) {
  return query(`
    SELECT 
      p.page_number,
      p.status,
      p.updated_at as date,
      b.name as book_name,
      b.id as book_path
    FROM pages p
    JOIN books b ON p.book_id = b.id
    WHERE p.editor_id = ?
    ORDER BY p.updated_at DESC
    LIMIT ?
  `, [userId, limit])
}
