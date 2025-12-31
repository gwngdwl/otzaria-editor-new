import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import * as User from '@/lib/models/user'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'שם משתמש או אימייל', type: 'text' },
        password: { label: 'סיסמה', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('נא למלא את כל השדות')
        }

        const user = await User.findByIdentifier(credentials.identifier)
        
        if (!user) {
          throw new Error('משתמש לא נמצא')
        }

        const isValid = await User.verifyPassword(user, credentials.password)
        
        if (!isValid) {
          throw new Error('סיסמה שגויה')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
