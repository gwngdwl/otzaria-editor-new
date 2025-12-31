import { NextResponse } from 'next/server'
import * as User from '@/lib/models/user'

export async function GET() {
  try {
    const users = await User.findAll()
    
    // Format for frontend (hide sensitive data)
    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      points: u.points,
      createdAt: u.created_at,
    }))
    
    return NextResponse.json({ success: true, users: formattedUsers })
  } catch (error) {
    console.error('Error loading users:', error)
    return NextResponse.json({ success: false, error: 'שגיאה בטעינת המשתמשים' }, { status: 500 })
  }
}
