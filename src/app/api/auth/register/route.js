import { NextResponse } from 'next/server'
import * as User from '@/lib/models/user'

export async function POST(request) {
  try {
    const { email, name, password } = await request.json()

    // Validation
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'נא למלא את כל השדות' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'הסיסמה חייבת להכיל לפחות 6 תווים' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingEmail = await User.findByEmail(email)
    if (existingEmail) {
      return NextResponse.json(
        { error: 'כתובת האימייל כבר קיימת במערכת' },
        { status: 400 }
      )
    }

    const existingName = await User.findByName(name)
    if (existingName) {
      return NextResponse.json(
        { error: 'שם המשתמש כבר תפוס' },
        { status: 400 }
      )
    }

    // Check if this should be admin
    const isAdmin = email === process.env.ADMIN_EMAIL
    const userCount = await User.count()
    const role = isAdmin || userCount === 0 ? 'admin' : 'user'

    // Create user
    const user = await User.create({
      email,
      name,
      password,
      role,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'שגיאה בהרשמה' },
      { status: 500 }
    )
  }
}
