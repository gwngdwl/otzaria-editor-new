import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { execute } from '@/lib/db'

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'אין הרשאה' }, { status: 403 })
    }

    const { bookId, pageNumber, updates } = await request.json()
    if (!bookId || !pageNumber) {
      return NextResponse.json({ success: false, error: 'חסרים פרמטרים' }, { status: 400 })
    }

    const fields = []
    const values = []

    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
      
      if (updates.status === 'available') {
        fields.push('editor_id = NULL')
        fields.push('editor_name = NULL')
        fields.push('claimed_at = NULL')
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: 'אין שדות לעדכון' }, { status: 400 })
    }

    values.push(bookId, pageNumber)
    await execute(`UPDATE pages SET ${fields.join(', ')} WHERE book_id = ? AND page_number = ?`, values)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
