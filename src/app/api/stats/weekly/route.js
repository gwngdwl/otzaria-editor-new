import { NextResponse } from 'next/server'
import * as Page from '@/lib/models/page'

export async function GET() {
  try {
    const { data, total } = await Page.getWeeklyProgress()
    
    return NextResponse.json({
      success: true,
      data,
      total
    })
  } catch (error) {
    console.error('Error loading weekly stats:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת הסטטיסטיקות' },
      { status: 500 }
    )
  }
}
