import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import * as Message from '@/lib/models/message'

// GET - List messages
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'יש להתחבר' }, { status: 401 })
    }
    
    const isAdmin = session.user.role === 'admin'
    const messages = await Message.findByUser(session.user.id, isAdmin)
    
    return NextResponse.json({ success: true, messages })
  } catch (error) {
    console.error('Error loading messages:', error)
    return NextResponse.json({ success: false, error: 'שגיאה בטעינת ההודעות' }, { status: 500 })
  }
}

// POST - Send message
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'יש להתחבר' }, { status: 401 })
    }
    
    const { subject, message, recipientId } = await request.json()
    
    if (!subject || !message) {
      return NextResponse.json({ success: false, error: 'נא למלא את כל השדות' }, { status: 400 })
    }
    
    const newMessage = await Message.create({
      senderId: session.user.id,
      senderName: session.user.name,
      recipientId: recipientId || null,
      subject,
      message,
    })
    
    return NextResponse.json({ success: true, message: newMessage })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ success: false, error: 'שגיאה בשליחת ההודעה' }, { status: 500 })
  }
}
