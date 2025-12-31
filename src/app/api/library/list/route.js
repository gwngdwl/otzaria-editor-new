import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Get books with page counts
    const books = await query(`
      SELECT 
        b.*,
        COUNT(p.id) as total_pages,
        SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_pages,
        SUM(CASE WHEN p.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_pages
      FROM books b
      LEFT JOIN pages p ON p.book_id = b.id
      GROUP BY b.id
      ORDER BY b.name
    `)

    return NextResponse.json({ success: true, books })
  } catch (error) {
    console.error('Error loading books:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
