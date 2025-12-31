import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
})

// Helper function for queries
export async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params)
  return results
}

// Helper for single row
export async function queryOne(sql, params = []) {
  const results = await query(sql, params)
  return results[0] || null
}

// Helper for insert and get ID
export async function insert(sql, params = []) {
  const [result] = await pool.execute(sql, params)
  return result.insertId
}

// Helper for update/delete and get affected rows
export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params)
  return result.affectedRows
}

// Transaction helper
export async function transaction(callback) {
  const connection = await pool.getConnection()
  await connection.beginTransaction()
  
  try {
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export default pool
