import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { execute, queryOne } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'לא מחובר' }, { status: 401 })
    }

    const { messageId, reply } = await request.json()
    if (!messageId || !reply?.trim()) {
      return NextResponse.json({ success: false, error: 'חסרים פרמטרים' }, { status: 400 })
    }

    // Check message exists
    const message = await queryOne('SELECT * FROM messages WHERE id = ?', [messageId])
    if (!message) {
      return NextResponse.json({ success: false, error: 'ההודעה לא נמצאה' }, { status: 404 })
    }

    // Add reply
    await execute(
      'INSERT INTO message_replies (message_id, sender_id, sender_name, message) VALUES (?, ?, ?, ?)',
      [messageId, session.user.id, session.user.name, reply.trim()]
    )

    // Update message status
    await execute('UPDATE messages SET status = ? WHERE id = ?', ['replied', messageId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error replying to message:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
