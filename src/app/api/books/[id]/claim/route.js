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

    // Check if page exists and is available
    const page = await queryOne(
      'SELECT * FROM pages WHERE book_id = ? AND page_number = ?',
      [bookId, pageNumber]
    )

    if (!page) {
      return NextResponse.json({ success: false, error: 'העמוד לא נמצא' }, { status: 404 })
    }

    if (page.status !== 'available') {
      return NextResponse.json({ success: false, error: 'העמוד כבר תפוס' }, { status: 400 })
    }

    // Claim the page
    await execute(
      `UPDATE pages SET 
        status = 'in-progress', 
        editor_id = ?, 
        editor_name = ?,
        claimed_at = NOW()
      WHERE book_id = ? AND page_number = ?`,
      [session.user.id, session.user.name, bookId, pageNumber]
    )

    // Log history
    await execute(
      'INSERT INTO page_history (page_id, user_id, action) VALUES (?, ?, ?)',
      [page.id, session.user.id, 'claimed']
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error claiming page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
