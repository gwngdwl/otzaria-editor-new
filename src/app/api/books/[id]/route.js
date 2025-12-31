import { NextResponse } from 'next/server'
import * as Book from '@/lib/models/book'
import * as Page from '@/lib/models/page'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const bookId = decodeURIComponent(id)
    
    // Try to find by ID first, then by name
    let book = await Book.findById(bookId)
    if (!book) {
      book = await Book.findByName(bookId)
    }
    
    if (!book) {
      return NextResponse.json(
        { success: false, error: 'הספר לא נמצא' },
        { status: 404 }
      )
    }
    
    const pages = await Page.findByBook(book.id)
    
    // Format pages for frontend
    const formattedPages = pages.map(page => ({
      number: page.page_number,
      status: page.status,
      claimedBy: page.editor_name,
      thumbnail: page.thumbnail_path,
      content: page.content,
    }))
    
    return NextResponse.json({
      success: true,
      book: {
        id: book.id,
        name: book.name,
        category: book.category,
        description: book.description,
        totalPages: book.total_pages,
      },
      pages: formattedPages
    })
  } catch (error) {
    console.error('Error loading book:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת הספר' },
      { status: 500 }
    )
  }
}
