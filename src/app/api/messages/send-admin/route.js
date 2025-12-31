import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { execute, query } from '@/lib/db'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'אין הרשאה' }, { status: 403 })
    }

    const { recipientId, subject, message, sendToAll } = await request.json()
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'חסרים פרמטרים' }, { status: 400 })
    }

    if (sendToAll) {
      // Send to all non-admin users
      const users = await query("SELECT id FROM users WHERE role != 'admin'")
      
      for (const user of users) {
        await execute(
          'INSERT INTO messages (sender_id, sender_name, recipient_id, subject, message, is_admin_message) VALUES (?, ?, ?, ?, ?, ?)',
          [session.user.id, session.user.name, user.id, subject.trim(), message.trim(), true]
        )
      }
      
      return NextResponse.json({ success: true, message: `ההודעה נשלחה ל-${users.length} משתמשים` })
    } else {
      // Send to specific user
      if (!recipientId) {
        return NextResponse.json({ success: false, error: 'חסר נמען' }, { status: 400 })
      }

      await execute(
        'INSERT INTO messages (sender_id, sender_name, recipient_id, subject, message, is_admin_message) VALUES (?, ?, ?, ?, ?, ?)',
        [session.user.id, session.user.name, recipientId, subject.trim(), message.trim(), true]
      )

      return NextResponse.json({ success: true, message: 'ההודעה נשלחה בהצלחה' })
    }
  } catch (error) {
    console.error('Error sending admin message:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
