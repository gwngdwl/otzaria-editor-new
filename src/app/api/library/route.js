import { NextResponse } from 'next/server'
import * as Book from '@/lib/models/book'

export async function GET() {
  try {
    const data = await Book.getLibraryStructure()
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error loading library:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת הספרייה' },
      { status: 500 }
    )
  }
}
