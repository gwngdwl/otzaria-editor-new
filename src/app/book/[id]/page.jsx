'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getAvatarColor, getInitial } from '@/lib/utils'

const pageStatusConfig = {
  available: { label: 'זמין', color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' },
  'in-progress': { label: 'בטיפול', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
  completed: { label: 'הושלם', color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
}

export default function BookPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const bookId = decodeURIComponent(params.id)
  
  const [bookData, setBookData] = useState(null)
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  useEffect(() => {
    loadBookData()
  }, [bookId])

  const loadBookData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/books/${encodeURIComponent(bookId)}`)
      const result = await response.json()
      
      if (result.success) {
        setBookData(result.book)
        setPages(result.pages || [])
      } else {
        setError(result.error || 'שגיאה בטעינת הספר')
      }
    } catch (err) {
      setError('שגיאה בטעינת הספר')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimPage = async (pageNumber) => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    setConfirmDialog({
      pageNumber,
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          const response = await fetch(`/api/books/${encodeURIComponent(bookId)}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageNumber })
          })
          
          const result = await response.json()
          if (result.success) {
            setPages(prev => prev.map(p => p.number === pageNumber ? result.page : p))
          } else {
            alert(result.error)
          }
        } catch (error) {
          alert('שגיאה בתפיסת העמוד')
        }
      },
      onCancel: () => setConfirmDialog(null)
    })
  }

  const handleReleasePage = async (pageNumber) => {
    if (!confirm('האם אתה בטוח שברצונך לשחרר את העמוד?')) return

    try {
      const response = await fetch(`/api/books/${encodeURIComponent(bookId)}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber })
      })
      
      const result = await response.json()
      if (result.success) {
        setPages(prev => prev.map(p => p.number === pageNumber ? result.page : p))
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('שגיאה בשחרור העמוד')
    }
  }

  const handleCompletePage = async (pageNumber) => {
    try {
      const response = await fetch(`/api/books/${encodeURIComponent(bookId)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber })
      })
      
      const result = await response.json()
      if (result.success) {
        setPages(prev => prev.map(p => p.number === pageNumber ? result.page : p))
        alert('העמוד הושלם בהצלחה!')
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('שגיאה בהשלמת העמוד')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-6xl text-primary mb-4 block">progress_activity</span>
          <p className="text-on-surface/70">טוען את הספר...</p>
        </div>
      </div>
    )
  }

  if (error || !bookData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-strong p-8 rounded-2xl max-w-md">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block">error</span>
          <h2 className="text-2xl font-bold text-on-surface mb-2">שגיאה</h2>
          <p className="text-on-surface/70 mb-4">{error}</p>
          <Link href="/books" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors">
            <span className="material-symbols-outlined">arrow_forward</span>
            <span>חזרה לספרייה</span>
          </Link>
        </div>
      </div>
    )
  }

  const stats = {
    total: pages.length,
    available: pages.filter(p => p.status === 'available').length,
    inProgress: pages.filter(p => p.status === 'in-progress').length,
    completed: pages.filter(p => p.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-strong border-b border-surface-variant sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/books" className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors">
              <span className="material-symbols-outlined">arrow_forward</span>
              <span>חזרה לספרייה</span>
            </Link>
            <div className="w-px h-8 bg-surface-variant" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-red-600">picture_as_pdf</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-on-surface">{bookData.name}</h1>
                <p className="text-sm text-on-surface/60">{stats.total} עמודים</p>
              </div>
            </div>
          </div>

          {session && (
            <Link href="/dashboard" className="flex items-center justify-center hover:opacity-80 transition-opacity" title={session.user.name}>
              <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-base shadow-md" style={{ backgroundColor: getAvatarColor(session.user.name) }}>
                {getInitial(session.user.name)}
              </div>
            </Link>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="glass p-4 rounded-xl text-center border border-surface-variant/30">
              <p className="text-3xl font-bold text-on-surface">{stats.total}</p>
              <p className="text-sm text-on-surface/70">סה"כ עמודים</p>
            </div>
            <div className="glass p-4 rounded-xl text-center border-2 border-gray-300">
              <p className="text-3xl font-bold text-gray-700">{stats.available}</p>
              <p className="text-sm text-gray-700">זמינים</p>
            </div>
            <div className="glass p-4 rounded-xl text-center border-2 border-blue-300">
              <p className="text-3xl font-bold text-blue-700">{stats.inProgress}</p>
              <p className="text-sm text-blue-700">בטיפול</p>
            </div>
            <div className="glass p-4 rounded-xl text-center border-2 border-green-300">
              <p className="text-3xl font-bold text-green-700">{stats.completed}</p>
              <p className="text-sm text-green-700">הושלמו</p>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 border border-surface-variant/30">
            <h2 className="text-2xl font-bold text-on-surface mb-6">עמודי הספר</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {pages.map((page) => (
                <PageCard
                  key={page.number}
                  page={page}
                  onClaim={handleClaimPage}
                  onComplete={handleCompletePage}
                  onRelease={handleReleasePage}
                  currentUser={session?.user}
                  bookId={bookId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {confirmDialog && (
        <ConfirmDialog
          pageNumber={confirmDialog.pageNumber}
          userName={session?.user?.name}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  )
}

function PageCard({ page, onClaim, onComplete, onRelease, currentUser, bookId }) {
  const status = pageStatusConfig[page.status]
  const isClaimedByMe = currentUser && page.claimedBy === currentUser.name

  return (
    <div className="group relative glass rounded-xl overflow-hidden border-2 border-surface-variant hover:border-primary/50 transition-all">
      <div className="aspect-[3/4] bg-surface flex items-center justify-center relative overflow-hidden">
        {page.thumbnail ? (
          <img src={page.thumbnail} alt={`עמוד ${page.number}`} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-6xl text-on-surface/20">description</span>
        )}
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold z-10">{page.number}</div>
        
        {page.status === 'in-progress' && isClaimedByMe && (
          <button
            onClick={() => onRelease(page.number)}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all shadow-lg z-20"
            title="שחרר עמוד"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-on-surface">עמוד {page.number}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${status.bgColor} ${status.color} ${status.borderColor}`}>
            {status.label}
          </span>
        </div>

        {page.claimedBy && (
          <p className="text-xs text-on-surface/60 mb-2 truncate">{isClaimedByMe ? 'שלך' : page.claimedBy}</p>
        )}

        {page.status === 'available' && (
          <button onClick={() => onClaim(page.number)} className="w-full py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-accent transition-colors">
            ערוך
          </button>
        )}

        {page.status === 'in-progress' && isClaimedByMe && (
          <div className="flex gap-2">
            <Link href={`/edit/${encodeURIComponent(bookId)}/${page.number}`} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center">
              ערוך
            </Link>
            <button onClick={() => onComplete(page.number)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">
              סיים
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfirmDialog({ pageNumber, userName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-primary">edit_note</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-2">עבודה על עמוד {pageNumber}</h2>
          <p className="text-on-surface/70">האם אתה מעוניין לעבוד על עמוד זה?</p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">מה יקרה?</p>
              <ul className="space-y-1">
                <li>• העמוד יסומן כ"בטיפול"</li>
                <li>• העמוד יוצמד אליך ({userName})</li>
                <li>• תקבל 5 נקודות</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors font-bold">
            <span className="material-symbols-outlined">check_circle</span>
            <span>כן, אני רוצה</span>
          </button>
          <button onClick={onCancel} className="px-6 py-3 border-2 border-surface-variant text-on-surface rounded-lg hover:bg-surface transition-colors">
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}
