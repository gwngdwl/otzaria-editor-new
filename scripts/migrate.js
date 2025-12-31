import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function migrate() {
  console.log('🚀 Starting database migration...')
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  })
  
  try {
    // Create database if not exists
    console.log('📦 Creating database...')
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await connection.query(`USE ${process.env.DB_NAME}`)
    
    // Read and execute schema
    console.log('📋 Executing schema...')
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    
    await connection.query(schema)
    
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

migrate()
