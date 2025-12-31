'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { getAvatarColor, getInitial } from '@/lib/utils'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const result = await response.json()
      
      if (result.success) {
        // Sort by points descending
        const sorted = result.users.sort((a, b) => (b.points || 0) - (a.points || 0))
        setUsers(sorted)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-6xl text-primary">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-on-surface">משתמשים</h1>
            <p className="text-on-surface/70">רשימת המשתתפים בפרויקט</p>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש משתמש..."
              className="w-full pr-12 pl-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:border-primary bg-white text-on-surface"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40">search</span>
          </div>

          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 bg-surface font-bold text-on-surface border-b border-surface-variant">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-7">משתמש</div>
              <div className="col-span-2 text-center">תפקיד</div>
              <div className="col-span-2 text-center">נקודות</div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-on-surface/30 mb-4 block">person_off</span>
                <p className="text-on-surface/60">לא נמצאו משתמשים</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-variant">
                {filteredUsers.map((user, index) => (
                  <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-surface/50 transition-colors">
                    <div className="col-span-1 text-center">
                      {index < 3 ? (
                        <span className={`material-symbols-outlined text-2xl ${
                          index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'
                        }`}>
                          emoji_events
                        </span>
                      ) : (
                        <span className="text-on-surface/60">{index + 1}</span>
                      )}
                    </div>
                    <div className="col-span-7 flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-base"
                        style={{ backgroundColor: getAvatarColor(user.name) }}
                      >
                        {getInitial(user.name)}
                      </div>
                      <span className="font-medium text-on-surface">{user.name}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-surface text-on-surface/70'
                      }`}>
                        {user.role === 'admin' ? 'מנהל' : 'משתמש'}
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-bold text-primary">{user.points || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
