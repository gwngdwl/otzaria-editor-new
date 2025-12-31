import { query, queryOne, execute, insert, transaction } from '../db.js'

// Find page by ID
export async function findById(id) {
  return queryOne('SELECT * FROM pages WHERE id = ?', [id])
}

// Find page by book and number
export async function findByBookAndNumber(bookId, pageNumber) {
  return queryOne(
    'SELECT * FROM pages WHERE book_id = ? AND page_number = ?',
    [bookId, pageNumber]
  )
}

// Get all pages for a book
export async function findByBook(bookId) {
  return query(
    'SELECT * FROM pages WHERE book_id = ? ORDER BY page_number',
    [bookId]
  )
}

// Create page
export async function create({ bookId, pageNumber, thumbnailPath }) {
  const id = await insert(
    `INSERT INTO pages (book_id, page_number, thumbnail_path) VALUES (?, ?, ?)`,
    [bookId, pageNumber, thumbnailPath || null]
  )
  return findById(id)
}

// Create multiple pages
export async function createMany(bookId, pages) {
  const values = pages.map(p => [bookId, p.pageNumber, p.thumbnailPath || null])
  const placeholders = values.map(() => '(?, ?, ?)').join(', ')
  const flatValues = values.flat()
  
  await execute(
    `INSERT INTO pages (book_id, page_number, thumbnail_path) VALUES ${placeholders}`,
    flatValues
  )
}

// Claim page (start editing)
export async function claim(bookId, pageNumber, userId, userName) {
  const page = await findByBookAndNumber(bookId, pageNumber)
  
  if (!page) {
    throw new Error('העמוד לא נמצא')
  }
  
  if (page.status !== 'available') {
    throw new Error('העמוד כבר תפוס')
  }
  
  await execute(
    `UPDATE pages SET 
      status = 'in-progress', 
      editor_id = ?, 
      editor_name = ?,
      claimed_at = NOW()
    WHERE book_id = ? AND page_number = ?`,
    [userId, userName, bookId, pageNumber]
  )
  
  // Log history
  await logHistory(page.id, userId, 'claimed')
  
  return findByBookAndNumber(bookId, pageNumber)
}

// Release page
export async function release(bookId, pageNumber, userId) {
  const page = await findByBookAndNumber(bookId, pageNumber)
  
  if (!page) {
    throw new Error('העמוד לא נמצא')
  }
  
  if (page.editor_id !== userId) {
    throw new Error('אין לך הרשאה לשחרר עמוד זה')
  }
  
  await execute(
    `UPDATE pages SET 
      status = 'available', 
      editor_id = NULL, 
      editor_name = NULL,
      claimed_at = NULL
    WHERE book_id = ? AND page_number = ?`,
    [bookId, pageNumber]
  )
  
  // Log history
  await logHistory(page.id, userId, 'released')
  
  return findByBookAndNumber(bookId, pageNumber)
}

// Complete page
export async function complete(bookId, pageNumber, userId, content = null) {
  const page = await findByBookAndNumber(bookId, pageNumber)
  
  if (!page) {
    throw new Error('העמוד לא נמצא')
  }
  
  if (page.editor_id !== userId) {
    throw new Error('אין לך הרשאה להשלים עמוד זה')
  }
  
  await execute(
    `UPDATE pages SET 
      status = 'completed', 
      content = ?,
      completed_at = NOW()
    WHERE book_id = ? AND page_number = ?`,
    [content, bookId, pageNumber]
  )
  
  // Log history
  await logHistory(page.id, userId, 'completed')
  
  return findByBookAndNumber(bookId, pageNumber)
}

// Update page content
export async function updateContent(bookId, pageNumber, content) {
  return execute(
    'UPDATE pages SET content = ? WHERE book_id = ? AND page_number = ?',
    [content, bookId, pageNumber]
  )
}

// Update page thumbnail
export async function updateThumbnail(bookId, pageNumber, thumbnailPath) {
  return execute(
    'UPDATE pages SET thumbnail_path = ? WHERE book_id = ? AND page_number = ?',
    [thumbnailPath, bookId, pageNumber]
  )
}

// Log page history
async function logHistory(pageId, userId, action) {
  await execute(
    'INSERT INTO page_history (page_id, user_id, action) VALUES (?, ?, ?)',
    [pageId, userId, action]
  )
}

// Get page history
export async function getHistory(pageId) {
  return query(`
    SELECT 
      ph.*,
      u.name as user_name
    FROM page_history ph
    LEFT JOIN users u ON ph.user_id = u.id
    WHERE ph.page_id = ?
    ORDER BY ph.created_at DESC
  `, [pageId])
}

// Get weekly progress stats
export async function getWeeklyProgress() {
  const results = await query(`
    SELECT 
      DATE(completed_at) as date,
      COUNT(*) as count
    FROM pages
    WHERE status = 'completed'
      AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(completed_at)
    ORDER BY date
  `)
  
  // Fill in missing days
  const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
  const data = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayName = days[date.getDay()]
    
    const found = results.find(r => r.date === dateStr)
    data.push({
      day: dayName,
      pages: found ? found.count : 0
    })
  }
  
  const total = data.reduce((sum, d) => sum + d.pages, 0)
  
  return { data, total }
}

// Get global stats
export async function getGlobalStats() {
  const result = await queryOne(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM pages
  `)
  
  return {
    total: result.total || 0,
    available: result.available || 0,
    inProgress: result.in_progress || 0,
    completed: result.completed || 0
  }
}
