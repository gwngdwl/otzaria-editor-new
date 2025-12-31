import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { execute, queryOne } from '@/lib/db'

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'אין הרשאה' }, { status: 403 })
    }

    const { userId, updates } = await request.json()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'חסר מזהה משתמש' }, { status: 400 })
    }

    const fields = []
    const values = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.role !== undefined) {
      fields.push('role = ?')
      values.push(updates.role)
    }
    if (updates.points !== undefined) {
      fields.push('points = ?')
      values.push(parseInt(updates.points) || 0)
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: 'אין שדות לעדכון' }, { status: 400 })
    }

    values.push(userId)
    await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId])
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
