import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import * as User from '@/lib/models/user'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'יש להתחבר' },
        { status: 401 }
      )
    }
    
    const stats = await User.getStats(session.user.id)
    const recentActivity = await User.getRecentActivity(session.user.id)
    
    // Format activity for frontend
    const formattedActivity = recentActivity.map(a => ({
      bookName: a.book_name,
      bookPath: a.book_path,
      pageNumber: a.page_number,
      status: a.status,
      date: new Date(a.date).toLocaleDateString('he-IL'),
    }))
    
    return NextResponse.json({
      success: true,
      stats,
      recentActivity: formattedActivity
    })
  } catch (error) {
    console.error('Error loading user stats:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת הסטטיסטיקות' },
      { status: 500 }
    )
  }
}
