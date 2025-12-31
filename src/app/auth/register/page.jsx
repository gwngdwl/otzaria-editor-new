'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', name: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'שגיאה בהרשמה')
        return
      }

      router.push('/auth/login?registered=true')
    } catch {
      setError('שגיאה בהרשמה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-bl from-primary-container via-background to-secondary-container">
      <div className="w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <Link href="/">
              <Image src="/logo.png" alt="לוגו אוצריא" width={80} height={80} />
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 text-on-surface">הרשמה</h1>
          <p className="text-center text-on-surface/70 mb-8">הצטרפו לספריית אוצריא</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">שם משתמש</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-on-surface"
                placeholder="השם שיוצג לאחרים"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">אימייל</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-on-surface"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">סיסמה</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-on-surface"
                placeholder="לפחות 6 תווים"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">אימות סיסמה</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-on-surface"
                placeholder="הזן שוב את הסיסמה"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-accent transition-all disabled:opacity-50 mt-6"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>נרשם...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">person_add</span>
                  <span>הירשם</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-on-surface/70">
              כבר יש לך חשבון?{' '}
              <Link href="/auth/login" className="text-primary font-medium hover:text-accent">התחבר</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
