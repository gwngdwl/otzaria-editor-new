import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'אין הרשאה' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const bookId = searchParams.get('book')
    const userId = searchParams.get('userId')

    let sql = `
      SELECT p.*, b.name as book_name
      FROM pages p
      JOIN books b ON p.book_id = b.id
      WHERE 1=1
    `
    const params = []

    if (status) {
      sql += ' AND p.status = ?'
      params.push(status)
    }
    if (bookId) {
      sql += ' AND p.book_id = ?'
      params.push(bookId)
    }
    if (userId) {
      sql += ' AND p.editor_id = ?'
      params.push(userId)
    }

    sql += ' ORDER BY b.name, p.page_number LIMIT 500'

    const pages = await query(sql, params)
    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error('Error loading pages:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
