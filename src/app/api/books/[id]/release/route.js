import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { execute, queryOne } from '@/lib/db'

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'לא מחובר' }, { status: 401 })
    }

    const { pageNumber } = await request.json()
    const bookId = params.id

    if (!pageNumber) {
      return NextResponse.json({ success: false, error: 'חסר מספר עמוד' }, { status: 400 })
    }

    const page = await queryOne(
      'SELECT * FROM pages WHERE book_id = ? AND page_number = ?',
      [bookId, pageNumber]
    )

    if (!page) {
      return NextResponse.json({ success: false, error: 'העמוד לא נמצא' }, { status: 404 })
    }

    // Only editor or admin can release
    if (page.editor_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'אין הרשאה לשחרר עמוד זה' }, { status: 403 })
    }

    // Release the page
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
    await execute(
      'INSERT INTO page_history (page_id, user_id, action) VALUES (?, ?, ?)',
      [page.id, session.user.id, 'released']
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error releasing page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
