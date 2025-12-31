import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { execute } from '@/lib/db'

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'אין הרשאה' }, { status: 403 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'חסר מזהה משתמש' }, { status: 400 })
    }

    if (userId === session.user.id) {
      return NextResponse.json({ success: false, error: 'לא ניתן למחוק את עצמך' }, { status: 400 })
    }

    await execute('DELETE FROM users WHERE id = ?', [userId])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
