import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import * as Upload from '@/lib/models/upload'
import { saveFile } from '@/lib/storage'
import { sanitizeFilename } from '@/lib/utils'

// GET - List user's uploads
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'יש להתחבר' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    
    const uploads = await Upload.findByUser(userId)
    
    return NextResponse.json({ success: true, uploads })
  } catch (error) {
    console.error('Error loading uploads:', error)
    return NextResponse.json({ success: false, error: 'שגיאה בטעינת ההעלאות' }, { status: 500 })
  }
}

// POST - Upload file
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'יש להתחבר' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file')
    const bookName = formData.get('bookName')
    
    if (!file || !bookName) {
      return NextResponse.json({ success: false, error: 'נא לבחור קובץ ושם ספר' }, { status: 400 })
    }
    
    // Validate file type
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json({ success: false, error: 'רק קבצי TXT מותרים' }, { status: 400 })
    }
    
    // Save file
    const buffer = Buffer.from(await file.arrayBuffer())
    const safeFilename = sanitizeFilename(file.name)
    const filePath = await saveFile(buffer, safeFilename, 'books')
    
    // Create upload record
    const upload = await Upload.create({
      userId: session.user.id,
      userName: session.user.name,
      bookName,
      fileName: file.name,
      filePath,
      fileSize: buffer.length,
    })
    
    return NextResponse.json({ success: true, upload })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ success: false, error: 'שגיאה בהעלאת הקובץ' }, { status: 500 })
  }
}
