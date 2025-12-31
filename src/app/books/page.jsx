'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { statusConfig } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function BooksPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [libraryData, setLibraryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadLibrary()
  }, [])

  const loadLibrary = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/library')
      const result = await response.json()
      
      if (result.success) {
        setLibraryData(result.data || [])
      } else {
        setError(result.error || 'שגיאה בטעינת הספרייה')
      }
    } catch (err) {
      setError('שגיאה בטעינת הספרייה: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const counts = { completed: 0, 'in-progress': 0, available: 0 }
    
    function count(items) {
      items.forEach(item => {
        if (item.type === 'file') {
          counts.completed += item.completedPages || 0
          counts['in-progress'] += item.inProgressPages || 0
          counts.available += item.availablePages || 0
        }
        if (item.children) count(item.children)
      })
    }
    
    count(libraryData)
    return counts
  }, [libraryData])

  const filteredData = useMemo(() => {
    let data = libraryData

    if (searchTerm) {
      const results = []
      const lowerSearch = searchTerm.toLowerCase()
      
      function search(items, path = []) {
        items.forEach(item => {
          const currentPath = [...path, item.name]
          if (item.name.toLowerCase().includes(lowerSearch)) {
            results.push({ ...item, path: currentPath })
          }
          if (item.children) search(item.children, currentPath)
        })
      }
      
      search(libraryData)
      return results
    }

    if (filterStatus !== 'all') {
      function filterByStatus(items) {
        return items.reduce((acc, item) => {
          if (item.type === 'folder') {
            const filteredChildren = filterByStatus(item.children || [])
            if (filteredChildren.length > 0) {
              acc.push({ ...item, children: filteredChildren })
            }
          } else if (item.status === filterStatus) {
            acc.push(item)
          }
          return acc
        }, [])
      }
      data = filterByStatus(data)
    }

    return data
  }, [searchTerm, filterStatus, libraryData])

  const handleFileClick = (file) => {
    const bookName = Array.isArray(file.path) ? file.path[file.path.length - 1] : file.name
    router.push(`/book/${encodeURIComponent(file.id || bookName)}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-6xl text-primary mb-4 block">progress_activity</span>
          <p className="text-on-surface/70">טוען את הספרייה...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-strong p-8 rounded-2xl max-w-md">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block">error</span>
          <h2 className="text-2xl font-bold text-on-surface mb-2">שגיאה</h2>
          <p className="text-on-surface/70 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors">
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col h-full">
              <h1 className="text-4xl font-bold mb-4 text-on-surface">ספריית אוצריא</h1>
              
              <p className="text-on-surface/70 leading-relaxed mb-5">
                ספרייה זו כוללת ספרים מאתר{' '}
                <a href="https://hebrewbooks.org/" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:text-accent underline">
                  hebrewbooks
                </a>{' '}
                שמיועדים להוספה למאגר אוצריא.
              </p>
              
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="חיפוש ספר..."
                  className="w-full pr-12 pl-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:border-primary bg-white text-on-surface"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40">search</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 mt-auto">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg transition-all font-medium whitespace-nowrap ${
                    filterStatus === 'all' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  הכל
                </button>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setFilterStatus(key)}
                    className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 whitespace-nowrap ${
                      filterStatus === key ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <WeeklyProgressChart />
          </div>

          <div className="grid lg:grid-cols-6 gap-6">
            <div className="lg:col-span-5">
              <CardGridView items={filteredData} onFileClick={handleFileClick} />
            </div>

            <div className="lg:col-span-1 space-y-4">
              <StatCard icon="check_circle" label="עמודים שהושלמו" value={stats.completed} color="green" />
              <StatCard icon="edit" label="עמודים בטיפול" value={stats['in-progress']} color="blue" />
              <StatCard icon="description" label="עמודים זמינים" value={stats.available} color="gray" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    green: 'from-green-50 to-green-100 border-green-200 text-green-700',
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    gray: 'from-gray-50 to-gray-100 border-gray-200 text-gray-700',
  }
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border-2`}>
      <div className="text-center">
        <div className={`w-10 h-10 bg-${color}-200 rounded-full flex items-center justify-center mx-auto mb-2`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <p className="text-xs font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}

function WeeklyProgressChart() {
  const [chartData, setChartData] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/weekly')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setChartData(result.data)
          setTotalPages(result.total)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-surface rounded-xl p-4 border border-surface-variant flex items-center justify-center h-[200px]">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl p-4 border border-surface-variant">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-on-surface mb-1">התקדמות שבועית</h2>
          <p className="text-xs text-on-surface/60">עמודים שהושלמו בשבוע האחרון</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-on-surface/60">סה"כ השבוע</p>
          <p className="text-2xl font-bold text-primary">{totalPages}</p>
        </div>
      </div>
      
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d8" />
            <XAxis dataKey="day" stroke="#6b5d4f" style={{ fontSize: '14px', fontWeight: 'bold' }} />
            <YAxis stroke="#6b5d4f" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fefbf6', border: '2px solid #6b5d4f', borderRadius: '8px', direction: 'rtl' }}
              formatter={(value) => [`${value} עמודים`, 'הושלמו']}
            />
            <Line type="monotone" dataKey="pages" stroke="#6b5d4f" strokeWidth={3} dot={{ fill: '#6b5d4f', r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 text-on-surface/60">
          <span className="material-symbols-outlined text-5xl mb-2 block">show_chart</span>
          <p>אין נתונים להצגה</p>
        </div>
      )}
    </div>
  )
}

function CardGridView({ items, onFileClick }) {
  const flattenItems = (items, path = []) => {
    let result = []
    items.forEach(item => {
      if (item.type === 'file') {
        result.push({ ...item, path: [...path, item.name] })
      }
      if (item.children) {
        result = [...result, ...flattenItems(item.children, [...path, item.name])]
      }
    })
    return result
  }

  const files = flattenItems(items)

  if (files.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-on-surface/30 mb-4 block">search_off</span>
        <p className="text-lg font-medium text-on-surface/70 mb-2">לא נמצאו תוצאות</p>
        <p className="text-sm text-on-surface/50">נסה לשנות את מונחי החיפוש או הסינון</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {files.map((file) => {
        const totalPages = file.totalPages || 0
        const completedPages = file.completedPages || 0
        const inProgressPages = file.inProgressPages || 0
        const combinedPages = completedPages + inProgressPages
        const completedPercentage = totalPages > 0 ? (completedPages / totalPages) * 100 : 0
        const inProgressPercentage = totalPages > 0 ? (inProgressPages / totalPages) * 100 : 0
        const totalPercentage = totalPages > 0 ? Math.round((combinedPages / totalPages) * 100) : 0
        
        return (
          <div
            key={file.id}
            onClick={() => onFileClick(file)}
            className="group relative rounded-3xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl border border-gray-200 overflow-hidden flex flex-col"
            style={{ minHeight: '140px', backgroundColor: '#F5EFE7' }}
          >
            <div className="flex items-start justify-between gap-3 p-6 flex-1">
              <div className="flex-shrink-0 p-1">
                <span className="material-symbols-outlined text-2xl" style={{ color: '#8B7355' }}>description</span>
              </div>
              <h3 className="flex-1 text-right text-lg font-bold" style={{ color: '#8B6F47' }}>{file.name}</h3>
            </div>
            
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: '#8B7355' }}>{combinedPages} / {totalPages}</span>
                <span className="text-xs font-bold" style={{ color: '#8B6F47' }}>{totalPercentage}%</span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                <div className="h-full flex">
                  <div className="h-full transition-all" style={{ width: `${completedPercentage}%`, backgroundColor: '#22c55e' }} />
                  <div className="h-full transition-all" style={{ width: `${inProgressPercentage}%`, backgroundColor: '#3b82f6' }} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
