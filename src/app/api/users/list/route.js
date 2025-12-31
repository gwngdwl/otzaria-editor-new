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

    // Get users with completed pages count
    const users = await query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.points, u.created_at,
        COUNT(DISTINCT CASE WHEN p.status = 'completed' AND p.editor_id = u.id THEN p.id END) as completed_pages
      FROM users u
      LEFT JOIN pages p ON p.editor_id = u.id
      GROUP BY u.id
      ORDER BY u.points DESC
    `)

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Error loading users:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
