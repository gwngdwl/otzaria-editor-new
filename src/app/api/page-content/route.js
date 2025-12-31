import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { query, queryOne, execute } from '@/lib/db'

// GET - Load page content
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'לא מחובר' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    const pageNumber = parseInt(searchParams.get('pageNumber'))

    if (!bookId || !pageNumber) {
      return NextResponse.json({ success: false, error: 'חסרים פרמטרים' }, { status: 400 })
    }

    // Get page with content
    const page = await queryOne(`
      SELECT p.*, pc.content, pc.left_column, pc.right_column, 
             pc.two_columns, pc.is_content_split, 
             pc.right_column_name, pc.left_column_name
      FROM pages p
      LEFT JOIN page_content pc ON p.id = pc.page_id
      WHERE p.book_id = ? AND p.page_number = ?
    `, [bookId, pageNumber])

    if (!page) {
      return NextResponse.json({ success: false, error: 'העמוד לא נמצא' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        content: page.content || '',
        left_column: page.left_column || '',
        right_column: page.right_column || '',
        two_columns: page.two_columns || false,
        is_content_split: page.is_content_split || false,
        right_column_name: page.right_column_name || 'חלק 1',
        left_column_name: page.left_column_name || 'חלק 2'
      }
    })
  } catch (error) {
    console.error('Error loading page content:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Save page content
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'לא מחובר' }, { status: 401 })
    }

    const body = await request.json()
    const { bookId, pageNumber, content, leftColumn, rightColumn, twoColumns, isContentSplit, rightColumnName, leftColumnName } = body

    if (!bookId || !pageNumber) {
      return NextResponse.json({ success: false, error: 'חסרים פרמטרים' }, { status: 400 })
    }

    // Get page ID
    const page = await queryOne('SELECT id FROM pages WHERE book_id = ? AND page_number = ?', [bookId, pageNumber])
    if (!page) {
      return NextResponse.json({ success: false, error: 'העמוד לא נמצא' }, { status: 404 })
    }

    // Check if content exists
    const existing = await queryOne('SELECT id FROM page_content WHERE page_id = ?', [page.id])

    if (existing) {
      // Update existing
      await execute(`
        UPDATE page_content SET 
          content = ?, left_column = ?, right_column = ?,
          two_columns = ?, is_content_split = ?,
          right_column_name = ?, left_column_name = ?,
          updated_at = NOW()
        WHERE page_id = ?
      `, [content || '', leftColumn || '', rightColumn || '', twoColumns ? 1 : 0, isContentSplit ? 1 : 0, rightColumnName || 'חלק 1', leftColumnName || 'חלק 2', page.id])
    } else {
      // Insert new
      await execute(`
        INSERT INTO page_content (page_id, content, left_column, right_column, two_columns, is_content_split, right_column_name, left_column_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [page.id, content || '', leftColumn || '', rightColumn || '', twoColumns ? 1 : 0, isContentSplit ? 1 : 0, rightColumnName || 'חלק 1', leftColumnName || 'חלק 2'])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving page content:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
