import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'לא מחובר' }, { status: 401 })
    }

    let messages
    if (session.user.role === 'admin') {
      // Admin sees all messages
      messages = await query(`
        SELECT m.*, u.name as sender_name, u.email as sender_email
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        ORDER BY m.created_at DESC
      `)
    } else {
      // User sees only their messages
      messages = await query(`
        SELECT m.*, u.name as sender_name
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.sender_id = ? OR m.recipient_id = ?
        ORDER BY m.created_at DESC
      `, [session.user.id, session.user.id])
    }

    // Get replies for each message
    for (const message of messages) {
      const replies = await query(`
        SELECT mr.*, u.name as sender_name
        FROM message_replies mr
        LEFT JOIN users u ON mr.sender_id = u.id
        WHERE mr.message_id = ?
        ORDER BY mr.created_at ASC
      `, [message.id])
      message.replies = replies
    }

    return NextResponse.json({ success: true, messages })
  } catch (error) {
    console.error('Error loading messages:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
