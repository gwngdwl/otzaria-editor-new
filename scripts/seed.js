import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function seed() {
  console.log('🌱 Starting database seeding...')
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
  
  try {
    // Create admin user
    console.log('👤 Creating admin user...')
    const adminId = crypto.randomUUID()
    const adminPassword = await bcrypt.hash('admin123', 12)
    
    await connection.execute(
      'INSERT IGNORE INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [adminId, process.env.ADMIN_EMAIL || 'admin@otzaria.com', 'מנהל', adminPassword, 'admin']
    )
    
    // Create sample book
    console.log('📚 Creating sample book...')
    const bookId = 'sample-book'
    
    await connection.execute(
      'INSERT IGNORE INTO books (id, name, category, total_pages) VALUES (?, ?, ?, ?)',
      [bookId, 'ספר לדוגמה', 'כללי', 10]
    )
    
    // Create sample pages
    console.log('📄 Creating sample pages...')
    for (let i = 1; i <= 10; i++) {
      await connection.execute(
        'INSERT IGNORE INTO pages (book_id, page_number, status) VALUES (?, ?, ?)',
        [bookId, i, 'available']
      )
    }
    
    console.log('✅ Seeding completed successfully!')
    console.log('')
    console.log('📝 Admin credentials:')
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@otzaria.com'}`)
    console.log('   Password: admin123')
    console.log('')
    console.log('⚠️  Please change the admin password after first login!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

seed()
