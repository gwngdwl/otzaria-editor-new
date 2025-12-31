import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { execute } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'אין הרשאה' }, { status: 403 })
    }

    const { bookId } = await request.json()
    if (!bookId) {
      return NextResponse.json({ success: false, error: 'חסר מזהה ספר' }, { status: 400 })
    }

    // Delete book files from uploads folder
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'books', bookId)
    try {
      await fs.rm(uploadsDir, { recursive: true, force: true })
    } catch (e) {
      console.log('No files to delete or error:', e.message)
    }

    // Delete from database (cascades to pages)
    await execute('DELETE FROM books WHERE id = ?', [bookId])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
