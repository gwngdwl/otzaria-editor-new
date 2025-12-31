import { query, queryOne, execute, insert } from '../db.js'

// Find book by ID
export async function findById(id) {
  return queryOne('SELECT * FROM books WHERE id = ?', [id])
}

// Find book by name
export async function findByName(name) {
  return queryOne('SELECT * FROM books WHERE name = ?', [name])
}

// Create new book
export async function create({ id, name, category, description, thumbnailPath, totalPages, sourceUrl }) {
  await execute(
    `INSERT INTO books (id, name, category, description, thumbnail_path, total_pages, source_url) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, category || null, description || null, thumbnailPath || null, totalPages || 0, sourceUrl || null]
  )
  return findById(id)
}

// Update book
export async function update(id, data) {
  const fields = []
  const values = []
  
  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.category !== undefined) {
    fields.push('category = ?')
    values.push(data.category)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    values.push(data.description)
  }
  if (data.thumbnailPath !== undefined) {
    fields.push('thumbnail_path = ?')
    values.push(data.thumbnailPath)
  }
  if (data.totalPages !== undefined) {
    fields.push('total_pages = ?')
    values.push(data.totalPages)
  }
  
  if (fields.length === 0) return 0
  
  values.push(id)
  return execute(
    `UPDATE books SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

// Delete book
export async function remove(id) {
  return execute('DELETE FROM books WHERE id = ?', [id])
}

// List all books with stats
export async function findAll() {
  return query(`
    SELECT 
      b.*,
      COUNT(p.id) as total_pages,
      SUM(CASE WHEN p.status = 'available' THEN 1 ELSE 0 END) as available_pages,
      SUM(CASE WHEN p.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_pages,
      SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_pages
    FROM books b
    LEFT JOIN pages p ON b.id = p.book_id
    GROUP BY b.id
    ORDER BY b.name
  `)
}

// List books by category
export async function findByCategory(category) {
  return query(`
    SELECT 
      b.*,
      COUNT(p.id) as total_pages,
      SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_pages
    FROM books b
    LEFT JOIN pages p ON b.id = p.book_id
    WHERE b.category = ?
    GROUP BY b.id
    ORDER BY b.name
  `, [category])
}

// Get all categories
export async function getCategories() {
  const results = await query('SELECT DISTINCT category FROM books WHERE category IS NOT NULL ORDER BY category')
  return results.map(r => r.category)
}

// Search books
export async function search(term) {
  const searchTerm = `%${term}%`
  return query(`
    SELECT 
      b.*,
      COUNT(p.id) as total_pages,
      SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_pages
    FROM books b
    LEFT JOIN pages p ON b.id = p.book_id
    WHERE b.name LIKE ? OR b.category LIKE ?
    GROUP BY b.id
    ORDER BY b.name
  `, [searchTerm, searchTerm])
}

// Count books
export async function count() {
  const result = await queryOne('SELECT COUNT(*) as count FROM books')
  return result.count
}

// Get library structure (for tree view)
export async function getLibraryStructure() {
  const books = await findAll()
  
  // Group by category
  const categories = {}
  
  for (const book of books) {
    const cat = book.category || 'אחר'
    if (!categories[cat]) {
      categories[cat] = {
        id: cat,
        name: cat,
        type: 'folder',
        children: []
      }
    }
    
    categories[cat].children.push({
      id: book.id,
      name: book.name,
      type: 'file',
      totalPages: book.total_pages,
      availablePages: book.available_pages || 0,
      inProgressPages: book.in_progress_pages || 0,
      completedPages: book.completed_pages || 0,
      status: book.completed_pages === book.total_pages ? 'completed' : 
              book.in_progress_pages > 0 ? 'in-progress' : 'available'
    })
  }
  
  return Object.values(categories)
}
