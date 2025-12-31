'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getAvatarColor, getInitial } from '@/lib/utils'

export default function EditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const bookId = params.bookId
  const pageNumber = parseInt(params.pageNumber)

  const [bookData, setBookData] = useState(null)
  const [pageData, setPageData] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Two columns state
  const [twoColumns, setTwoColumns] = useState(false)
  const [leftColumn, setLeftColumn] = useState('')
  const [rightColumn, setRightColumn] = useState('')
  const [activeTextarea, setActiveTextarea] = useState(null)
  const [rightColumnName, setRightColumnName] = useState('חלק 1')
  const [leftColumnName, setLeftColumnName] = useState('חלק 2')
  const [splitMode, setSplitMode] = useState('content')
  const [isContentSplit, setIsContentSplit] = useState(false)
  const [showSplitDialog, setShowSplitDialog] = useState(false)

  // Editor settings
  const [selectedFont, setSelectedFont] = useState('monospace')
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')

  // OCR state
  const [isOcrProcessing, setIsOcrProcessing] = useState(false)
  const [ocrMethod, setOcrMethod] = useState('tesseract')
  const [userApiKey, setUserApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')
  const [customPrompt, setCustomPrompt] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Image state
  const [imageZoom, setImageZoom] = useState(100)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  const [selectionRect, setSelectionRect] = useState(null)
  const imageContainerRef = useRef(null)
  const autoScrollRef = useRef(null)

  // Layout state
  const [imagePanelWidth, setImagePanelWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const [layoutOrientation, setLayoutOrientation] = useState('vertical')
  const [showInfoDialog, setShowInfoDialog] = useState(false)

  const defaultPrompt = `The text is in Hebrew, written in Rashi script.
Transcription guidelines:
- Transcribe exactly what you see
- Do NOT add nikud unless they appear in the image
- Preserve all line breaks and spacing
- Return only the Hebrew text`

  // Load settings from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key')
    const savedPrompt = localStorage.getItem('gemini_prompt')
    const savedModel = localStorage.getItem('gemini_model')
    const savedWidth = localStorage.getItem('imagePanelWidth')
    const savedOrientation = localStorage.getItem('layoutOrientation')
    if (savedApiKey) setUserApiKey(savedApiKey)
    if (savedPrompt) setCustomPrompt(savedPrompt)
    else setCustomPrompt(defaultPrompt)
    if (savedModel) setSelectedModel(savedModel)
    if (savedWidth) setImagePanelWidth(parseFloat(savedWidth))
    if (savedOrientation) setLayoutOrientation(savedOrientation)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      loadPageData()
    }
  }, [status, bookId, pageNumber])

  useEffect(() => {
    if (bookData?.name) {
      document.title = `עריכה: ${bookData.name} - עמוד ${pageNumber}`
    }
  }, [bookData, pageNumber])

  const loadPageData = async () => {
    try {
      setLoading(true)
      setError(null)
      const bookRes = await fetch(`/api/books/${bookId}`)
      const bookResult = await bookRes.json()
      if (bookResult.success) {
        setBookData(bookResult.book)
        const page = bookResult.pages?.find(p => p.page_number === pageNumber)
        setPageData(page)
      } else {
        setError(bookResult.error || 'שגיאה בטעינת הספר')
        return
      }
      const contentRes = await fetch(`/api/page-content?bookId=${bookId}&pageNumber=${pageNumber}`)
      const contentResult = await contentRes.json()
      if (contentResult.success && contentResult.data) {
        const d = contentResult.data
        setContent(d.content || '')
        setLeftColumn(d.left_column || '')
        setRightColumn(d.right_column || '')
        setRightColumnName(d.right_column_name || 'חלק 1')
        setLeftColumnName(d.left_column_name || 'חלק 2')
        setTwoColumns(d.two_columns || false)
      }
    } catch (err) {
      setError(err.message || 'שגיאה בטעינת העמוד')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSave = (text) => {
    setContent(text)
    debouncedSave(text, leftColumn, rightColumn, twoColumns)
  }

  const handleColumnChange = (column, newText) => {
    if (column === 'left') {
      setLeftColumn(newText)
      debouncedSave(content, newText, rightColumn, twoColumns)
    } else {
      setRightColumn(newText)
      debouncedSave(content, leftColumn, newText, twoColumns)
    }
  }

  const debouncedSave = (() => {
    let timeout
    return (contentText, leftText, rightText, twoCol) => {
      clearTimeout(timeout)
      timeout = setTimeout(async () => {
        try {
          await fetch('/api/page-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookId, pageNumber, content: contentText,
              leftColumn: leftText, rightColumn: rightText,
              twoColumns: twoCol, isContentSplit,
              rightColumnName, leftColumnName
            })
          })
        } catch (e) { console.error('Auto-save error:', e) }
      }, 2000)
    }
  })()

  const toggleColumns = () => {
    if (!twoColumns) setShowSplitDialog(true)
    else {
      const combined = rightColumn + leftColumn
      setContent(combined)
      setTwoColumns(false)
      debouncedSave(combined, leftColumn, rightColumn, false)
    }
  }

  const confirmSplit = () => {
    setRightColumn(content)
    setLeftColumn('')
    setTwoColumns(true)
    setIsContentSplit(splitMode === 'content')
    setShowSplitDialog(false)
    debouncedSave(content, '', content, true)
  }


  const handleFindReplace = (replaceAll = false) => {
    if (!findText) { alert('אנא הזן טקסט לחיפוש'); return }
    const pFind = findText.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
    const pReplace = replaceText.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
    let updatedContent = content, updatedLeft = leftColumn, updatedRight = rightColumn, count = 0
    if (twoColumns) {
      if (replaceAll) {
        const rc = (rightColumn.match(new RegExp(pFind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
        const lc = (leftColumn.match(new RegExp(pFind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
        count = rc + lc
        updatedRight = rightColumn.split(pFind).join(pReplace)
        updatedLeft = leftColumn.split(pFind).join(pReplace)
      } else {
        if (rightColumn.includes(pFind)) { updatedRight = rightColumn.replace(pFind, pReplace); count = 1 }
        else if (leftColumn.includes(pFind)) { updatedLeft = leftColumn.replace(pFind, pReplace); count = 1 }
      }
      setRightColumn(updatedRight); setLeftColumn(updatedLeft)
      debouncedSave(content, updatedLeft, updatedRight, twoColumns)
    } else {
      if (replaceAll) {
        count = (content.match(new RegExp(pFind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
        updatedContent = content.split(pFind).join(pReplace)
      } else {
        if (content.includes(pFind)) { updatedContent = content.replace(pFind, pReplace); count = 1 }
      }
      setContent(updatedContent)
      debouncedSave(updatedContent, leftColumn, rightColumn, twoColumns)
    }
    alert(count > 0 ? `✅ הוחלפו ${count} מופעים` : '❌ לא נמצאו תוצאות')
  }

  const getImageCoordinates = (e, img) => {
    const container = img.parentElement
    const containerRect = container.getBoundingClientRect()
    const containerX = e.clientX - containerRect.left
    const containerY = e.clientY - containerRect.top
    const scale = imageZoom / 100
    const displayX = containerRect.width - containerX
    const displayY = containerY
    const x = displayX / scale
    const y = displayY / scale
    return { x, y, displayX, displayY }
  }

  const handleContainerMouseDown = (e) => {
    if (!isSelectionMode) return
    if (e.target.classList.contains('selection-overlay')) return
    e.preventDefault(); e.stopPropagation()
    const container = e.currentTarget
    const img = container.querySelector('img')
    if (!img) return
    const coords = getImageCoordinates(e, img)
    const scale = imageZoom / 100
    const scaledWidth = img.naturalWidth * scale
    const scaledHeight = img.naturalHeight * scale
    if (coords.displayX < 0 || coords.displayY < 0 || coords.displayX > scaledWidth || coords.displayY > scaledHeight) return
    setSelectionStart(coords); setSelectionEnd(coords); setSelectionRect(null)
  }

  const handleContainerMouseMove = (e) => {
    if (!isSelectionMode || !selectionStart) return
    e.preventDefault(); e.stopPropagation()
    const container = e.currentTarget
    const img = container.querySelector('img')
    if (!img) return
    const coords = getImageCoordinates(e, img)
    setSelectionEnd(coords)
    const scrollContainer = imageContainerRef.current
    if (!scrollContainer) return
    const containerRect = scrollContainer.getBoundingClientRect()
    const mouseX = e.clientX, mouseY = e.clientY
    const scrollSpeed = 15, edgeThreshold = 50
    if (autoScrollRef.current) { clearInterval(autoScrollRef.current); autoScrollRef.current = null }
    let scrollX = 0, scrollY = 0
    if (mouseY < containerRect.top + edgeThreshold) scrollY = -scrollSpeed
    else if (mouseY > containerRect.bottom - edgeThreshold) scrollY = scrollSpeed
    if (mouseX < containerRect.left + edgeThreshold) scrollX = -scrollSpeed
    else if (mouseX > containerRect.right - edgeThreshold) scrollX = scrollSpeed
    if (scrollX !== 0 || scrollY !== 0) {
      autoScrollRef.current = setInterval(() => {
        if (scrollX !== 0) scrollContainer.scrollLeft += scrollX
        if (scrollY !== 0) scrollContainer.scrollTop += scrollY
      }, 16)
    }
  }

  const handleContainerMouseUp = (e) => {
    if (autoScrollRef.current) { clearInterval(autoScrollRef.current); autoScrollRef.current = null }
    if (!isSelectionMode || !selectionStart || !selectionEnd) return
    e.preventDefault(); e.stopPropagation()
    const minDisplayX = Math.min(selectionStart.displayX, selectionEnd.displayX)
    const maxDisplayX = Math.max(selectionStart.displayX, selectionEnd.displayX)
    const minDisplayY = Math.min(selectionStart.displayY, selectionEnd.displayY)
    const maxDisplayY = Math.max(selectionStart.displayY, selectionEnd.displayY)
    const displayWidth = maxDisplayX - minDisplayX
    const displayHeight = maxDisplayY - minDisplayY
    if (displayWidth < 20 || displayHeight < 20) {
      setSelectionStart(null); setSelectionEnd(null)
      alert('⚠️ האזור קטן מדי'); return
    }
    const minX = Math.min(selectionStart.x, selectionEnd.x)
    const maxX = Math.max(selectionStart.x, selectionEnd.x)
    const minY = Math.min(selectionStart.y, selectionEnd.y)
    const maxY = Math.max(selectionStart.y, selectionEnd.y)
    const container = e.currentTarget
    const containerRect = container.getBoundingClientRect()
    setSelectionRect({
      displayX: containerRect.width - maxDisplayX, displayY: minDisplayY,
      displayWidth, displayHeight,
      x: minX, y: minY, width: maxX - minX, height: maxY - minY
    })
    setSelectionStart(null); setSelectionEnd(null)
  }

  const toggleSelectionMode = () => {
    if (autoScrollRef.current) { clearInterval(autoScrollRef.current); autoScrollRef.current = null }
    setIsSelectionMode(!isSelectionMode)
    setSelectionStart(null); setSelectionEnd(null); setSelectionRect(null)
  }

  const handleGeminiOCR = async (croppedBlob) => {
    const reader = new FileReader()
    const base64Promise = new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result.split(',')[1])
      reader.readAsDataURL(croppedBlob)
    })
    const imageBase64 = await base64Promise
    const response = await fetch('/api/gemini-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, model: selectedModel, userApiKey: userApiKey || undefined, customPrompt: customPrompt || undefined })
    })
    const result = await response.json()
    if (!result.success) throw new Error(result.error || 'Gemini OCR failed')
    return result.text
  }

  const saveSettings = () => {
    localStorage.setItem('gemini_api_key', userApiKey)
    localStorage.setItem('gemini_prompt', customPrompt)
    localStorage.setItem('gemini_model', selectedModel)
    alert('✅ ההגדרות נשמרו')
  }

  const resetPrompt = () => setCustomPrompt(defaultPrompt)

  const handleResizeStart = (e) => { e.preventDefault(); setIsResizing(true) }

  useEffect(() => {
    if (!isResizing) return
    const handleMouseMove = (e) => {
      const container = document.querySelector('.split-container')
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      let newSize
      if (layoutOrientation === 'horizontal') {
        const mouseY = e.clientY - containerRect.top
        newSize = (mouseY / containerRect.height) * 100
      } else {
        const mouseX = containerRect.right - e.clientX
        newSize = (mouseX / containerRect.width) * 100
      }
      setImagePanelWidth(Math.min(Math.max(newSize, 20), 80))
    }
    const handleMouseUp = () => {
      setIsResizing(false)
      localStorage.setItem('imagePanelWidth', imagePanelWidth.toString())
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, imagePanelWidth, layoutOrientation])


  const handleOCRSelection = async () => {
    if (!selectionRect) { alert('❌ אנא בחר אזור בתמונה תחילה'); return }
    setIsOcrProcessing(true)
    try {
      const progressDiv = document.createElement('div')
      progressDiv.id = 'ocr-progress'
      progressDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3'
      progressDiv.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span><span>מעבד OCR... <span id="ocr-percent">0%</span></span>`
      document.body.appendChild(progressDiv)
      const thumbnailUrl = pageData?.thumbnail_path ? `/uploads/${pageData.thumbnail_path}` : null
      if (!thumbnailUrl) throw new Error('No image available')
      const response = await fetch(thumbnailUrl)
      if (!response.ok) throw new Error('Failed to load image')
      const blob = await response.blob()
      const img = await createImageBitmap(blob)
      const canvas = document.createElement('canvas')
      canvas.width = selectionRect.width
      canvas.height = selectionRect.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height, 0, 0, selectionRect.width, selectionRect.height)
      const croppedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95))
      let extractedText = ''
      if (ocrMethod === 'gemini') {
        progressDiv.querySelector('span:last-child').innerHTML = `מעבד Gemini AI... ⏳`
        extractedText = await handleGeminiOCR(croppedBlob)
      } else {
        const Tesseract = (await import('tesseract.js')).default
        const result = await Tesseract.recognize(croppedBlob, 'heb', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const percent = Math.round(m.progress * 100)
              const el = document.getElementById('ocr-percent')
              if (el) el.textContent = `${percent}%`
            }
          }
        })
        extractedText = result.data.text.trim()
      }
      progressDiv.remove()
      extractedText = extractedText.trim()
      if (!extractedText) { alert('⚠️ לא זוהה טקסט באזור הנבחר'); return }
      if (twoColumns) {
        const newRight = rightColumn + (rightColumn ? '\n\n' : '') + extractedText
        setRightColumn(newRight)
        debouncedSave(content, leftColumn, newRight, twoColumns)
      } else {
        const newContent = content + (content ? '\n\n' : '') + extractedText
        setContent(newContent)
        debouncedSave(newContent, leftColumn, rightColumn, twoColumns)
      }
      alert(`✅ OCR הושלם! זוהו ${extractedText.length} תווים`)
      setSelectionRect(null); setIsSelectionMode(false)
    } catch (error) {
      console.error('OCR Error:', error)
      alert('❌ שגיאה בעיבוד OCR: ' + error.message)
      const pd = document.getElementById('ocr-progress')
      if (pd) pd.remove()
    } finally {
      setIsOcrProcessing(false)
    }
  }

  const insertTag = (tag) => {
    let currentText, column
    if (twoColumns) {
      if (activeTextarea === 'left') { currentText = leftColumn; column = 'left' }
      else { currentText = rightColumn; column = 'right' }
    } else { currentText = content; column = null }
    const textarea = column ? document.querySelector(`textarea[data-column="${column}"]`) : document.querySelector('textarea')
    if (!textarea) return
    const scrollTop = textarea.scrollTop
    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const selectedText = currentText.substring(start, end)
    const beforeText = currentText.substring(0, start)
    const afterText = currentText.substring(end)
    let insertedText = ''
    const defaults = { b: 'טקסט מודגש', i: 'טקסט נטוי', u: 'קו תחתון', big: 'טקסט גדול', small: 'טקסט קטן', h1: 'כותרת 1', h2: 'כותרת 2', h3: 'כותרת 3' }
    insertedText = `<${tag}>${selectedText || defaults[tag] || ''}</${tag}>`
    const newText = beforeText + insertedText + afterText
    if (column === 'left') { setLeftColumn(newText); debouncedSave(content, newText, rightColumn, twoColumns) }
    else if (column === 'right') { setRightColumn(newText); debouncedSave(content, leftColumn, newText, twoColumns) }
    else { setContent(newText); debouncedSave(newText, leftColumn, rightColumn, twoColumns) }
    setTimeout(() => {
      textarea.focus()
      const newPos = start + insertedText.length
      textarea.setSelectionRange(newPos, newPos)
      textarea.scrollTop = scrollTop
    }, 0)
  }

  const getEditingInstructions = () => {
    const bookName = bookData?.name || ''
    const defaultInstructions = {
      title: 'הנחיות עריכה כלליות',
      sections: [
        { title: 'כללי', items: ['העתק את הטקסט בדיוק כפי שהוא מופיע', 'שמור על מבנה הפסקאות', 'השתמש בכלי OCR לזיהוי אוטומטי'] },
        { title: 'תיוג', items: ['<b> למודגש', '<h1>,<h2>,<h3> לכותרות', '<small> להערות'] },
        { title: 'שמירה', items: ['הטקסט נשמר אוטומטית', 'אין צורך בכפתור שמירה'] }
      ]
    }
    if (bookName.includes('תלמוד') || bookName.includes('גמרא')) {
      return {
        title: 'הנחיות עריכה - תלמוד',
        sections: [
          { title: 'מבנה הדף', items: ['פצל לשני טורים: גמרא ורש"י/תוספות', 'השתמש בכפתור "שני טורים"'] },
          { title: 'כתב רש"י', items: ['מ"ם סופית דומה לסמ"ך', 'אל"ף דומה לח"ית', 'השתמש ב-Gemini OCR'] }
        ]
      }
    }
    return defaultInstructions
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-6xl text-primary mb-4 block">progress_activity</span>
          <p className="text-on-surface/70">טוען עמוד...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center glass-strong p-8 rounded-2xl max-w-md">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block">error</span>
          <h2 className="text-2xl font-bold text-on-surface mb-2">שגיאה</h2>
          <p className="text-on-surface/70 mb-4">{error}</p>
          <Link href={`/book/${bookId}`} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent">
            <span className="material-symbols-outlined">arrow_forward</span>
            <span>חזרה לספר</span>
          </Link>
        </div>
      </div>
    )
  }

  const thumbnailUrl = pageData?.thumbnail_path ? `/uploads/${pageData.thumbnail_path}` : null


  return (
    <>
      <style jsx global>{`
        .overflow-auto::-webkit-scrollbar { width: 12px; height: 12px; }
        .overflow-auto::-webkit-scrollbar-track { background: #e7e0d8; border-radius: 6px; }
        .overflow-auto::-webkit-scrollbar-thumb { background: #6b5d4f; border-radius: 6px; }
        .overflow-auto::-webkit-scrollbar-thumb:hover { background: #5a4d3f; }
      `}</style>
      <div className="h-screen bg-background flex flex-col overflow-hidden" style={{ cursor: isResizing ? 'col-resize' : 'default', userSelect: isResizing ? 'none' : 'auto' }}>
        {/* Header */}
        <header className="glass-strong border-b border-surface-variant sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80">
                  <img src="/logo.png" alt="לוגו" className="w-10 h-10" />
                  <span className="text-lg font-bold text-black">ספריית אוצריא</span>
                </Link>
                <div className="w-px h-8 bg-surface-variant"></div>
                <Link href={`/book/${bookId}`} className="flex items-center gap-2 text-on-surface hover:text-primary">
                  <span className="material-symbols-outlined">arrow_forward</span>
                  <span>חזרה לספר</span>
                </Link>
                <div className="w-px h-8 bg-surface-variant"></div>
                <div>
                  <h1 className="text-lg font-bold text-on-surface">{bookData?.name} - עמוד {pageNumber}</h1>
                  <p className="text-xs text-on-surface/60">עריכת טקסט</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>נשמר אוטומטית</span>
                </div>
                <Link href="/dashboard" className="flex items-center justify-center hover:opacity-80" title={session?.user?.name}>
                  <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-base shadow-md" style={{ backgroundColor: getAvatarColor(session?.user?.name || '') }}>
                    {getInitial(session?.user?.name || '')}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
          <div className="container mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
              {/* Left Side - Image Tools */}
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 h-8 rounded-lg transition-colors flex items-center ${showSettings ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`} title="הגדרות OCR">
                  <span className="material-symbols-outlined text-base">settings</span>
                </button>
                <div className="w-px h-6 bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-medium">עמוד {pageNumber} מתוך {bookData?.total_pages}</span>
                <div className="w-px h-6 bg-gray-200"></div>
                {/* Zoom Controls */}
                <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setImageZoom(Math.max(25, imageZoom - 10))} className="w-8 h-8 hover:bg-white rounded-md transition-colors flex items-center justify-center" title="הקטן">
                    <span className="material-symbols-outlined text-base">zoom_out</span>
                  </button>
                  <span className="text-xs font-medium min-w-[2.5rem] text-center text-gray-700">{imageZoom}%</span>
                  <button onClick={() => setImageZoom(Math.min(300, imageZoom + 10))} className="w-8 h-8 hover:bg-white rounded-md transition-colors flex items-center justify-center" title="הגדל">
                    <span className="material-symbols-outlined text-base">zoom_in</span>
                  </button>
                  <button onClick={() => setImageZoom(100)} className="w-12 h-8 hover:bg-white rounded-md transition-colors text-xs font-medium flex items-center justify-center" title="איפוס">100%</button>
                </div>
                <div className="w-px h-6 bg-gray-200"></div>
                {/* OCR Method */}
                <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setOcrMethod('tesseract')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all h-8 flex items-center gap-1.5 ${ocrMethod === 'tesseract' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`} title="Tesseract OCR">
                    <span className="material-symbols-outlined text-base">text_fields</span><span>OCR</span>
                  </button>
                  <button onClick={() => setOcrMethod('gemini')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all h-8 flex items-center gap-1.5 ${ocrMethod === 'gemini' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`} title="Gemini AI">
                    <span>✨</span><span>Gemini</span>
                  </button>
                </div>
                <button onClick={toggleSelectionMode} disabled={isOcrProcessing || !thumbnailUrl} className={`w-8 h-8 rounded-lg border transition-all disabled:opacity-40 flex items-center justify-center ${isSelectionMode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'}`} title="בחר אזור">
                  <span className={`material-symbols-outlined text-base ${isOcrProcessing ? 'animate-spin' : ''}`}>{isOcrProcessing ? 'progress_activity' : 'document_scanner'}</span>
                </button>
                {selectionRect && (
                  <>
                    <button onClick={handleOCRSelection} disabled={isOcrProcessing} className="flex items-center gap-2 px-3 py-1.5 h-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40" title="זהה טקסט">
                      <span className="material-symbols-outlined text-base">check_circle</span><span className="text-xs font-medium">זהה אזור</span>
                    </button>
                    <button onClick={() => { setSelectionRect(null); setIsSelectionMode(false) }} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="בטל">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </>
                )}
              </div>
              {/* Right Side - Text Tools */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => insertTag('b')} className="w-8 h-8 hover:bg-white rounded-md transition-colors flex items-center justify-center" title="מודגש"><span className="font-bold text-sm">B</span></button>
                  <button onClick={() => insertTag('i')} className="w-8 h-8 hover:bg-white rounded-md transition-colors flex items-center justify-center" title="נטוי"><span className="italic text-sm">I</span></button>
                  <button onClick={() => insertTag('u')} className="w-8 h-8 hover:bg-white rounded-md transition-colors flex items-center justify-center" title="קו תחתון"><span className="underline text-sm">U</span></button>
                </div>
                <div className="w-px h-6 bg-gray-200"></div>
                <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => insertTag('big')} className="w-8 h-8 hover:bg-white rounded-md transition-colors flex items-center justify-center text-sm font-medium" title="גדול">A+</button>
                  <button onClick={() => insertTag('small')} className="w-8 h-8 hover:bg-white rounded-md transition-colors flex items-center justify-center text-xs font-medium" title="קטן">A-</button>
                </div>
                <div className="w-px h-6 bg-gray-200"></div>
                <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => insertTag('h1')} className="px-2.5 h-8 hover:bg-white rounded-md transition-colors text-xs font-bold flex items-center justify-center" title="כותרת 1">H1</button>
                  <button onClick={() => insertTag('h2')} className="px-2.5 h-8 hover:bg-white rounded-md transition-colors text-xs font-bold flex items-center justify-center" title="כותרת 2">H2</button>
                  <button onClick={() => insertTag('h3')} className="px-2.5 h-8 hover:bg-white rounded-md transition-colors text-xs font-bold flex items-center justify-center" title="כותרת 3">H3</button>
                </div>
                <div className="w-px h-6 bg-gray-200"></div>
                <button onClick={() => setShowFindReplace(true)} className="flex items-center gap-2 px-3 py-1.5 h-8 bg-white hover:bg-gray-50 rounded-lg border border-gray-200" title="חיפוש והחלפה">
                  <span className="material-symbols-outlined text-base">find_replace</span><span className="text-xs font-medium">חיפוש</span>
                </button>
                <div className="w-px h-6 bg-gray-200"></div>
                <select value={selectedFont} className="appearance-none pl-3 pr-8 h-8 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none cursor-pointer hover:bg-gray-50" onChange={(e) => setSelectedFont(e.target.value)}>
                  <option value="monospace">Monospace</option>
                  <option value="Arial">Arial</option>
                  <option value="'Times New Roman'">Times New Roman</option>
                </select>
                <div className="w-px h-6 bg-gray-200"></div>
                <button onClick={toggleColumns} className="w-8 h-8 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center" title={twoColumns ? 'איחוד' : 'פיצול'}>
                  <span className="material-symbols-outlined text-base" style={{ transform: 'rotate(90deg)' }}>{twoColumns ? 'unfold_less' : 'unfold_more'}</span>
                </button>
                <button onClick={() => { const n = layoutOrientation === 'vertical' ? 'horizontal' : 'vertical'; setLayoutOrientation(n); localStorage.setItem('layoutOrientation', n) }} className="w-8 h-8 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center" title="שנה פריסה">
                  <span className="material-symbols-outlined text-base" style={{ transform: layoutOrientation === 'horizontal' ? 'rotate(90deg)' : 'none' }}>splitscreen</span>
                </button>
                <div className="w-px h-6 bg-gray-200"></div>
                <button onClick={() => setShowInfoDialog(true)} className="w-8 h-8 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors flex items-center justify-center" title="הנחיות">
                  <span className="material-symbols-outlined text-base">info</span>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          <div className="glass-strong rounded-xl border border-surface-variant flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden split-container" style={{ position: 'relative', flexDirection: layoutOrientation === 'horizontal' ? 'column' : 'row' }}>
              {/* Image Side */}
              <div ref={imageContainerRef} className="overflow-auto p-4" style={{ width: layoutOrientation === 'horizontal' ? '100%' : `${imagePanelWidth}%`, height: layoutOrientation === 'horizontal' ? `${imagePanelWidth}%` : 'auto', flexShrink: 0 }}>
                {thumbnailUrl ? (
                  <div className="inline-block relative" onMouseDown={handleContainerMouseDown} onMouseMove={handleContainerMouseMove} onMouseUp={handleContainerMouseUp} style={{ cursor: isSelectionMode ? 'crosshair' : 'default' }}>
                    <img src={thumbnailUrl} alt={`עמוד ${pageNumber}`} className="rounded-lg shadow-lg transition-all select-none" style={{ transform: `scale(${imageZoom / 100})`, transformOrigin: 'top right', maxWidth: 'none', pointerEvents: 'none' }} onDragStart={(e) => e.preventDefault()} />
                    {/* Selection Overlay - during drag */}
                    {isSelectionMode && selectionStart && selectionEnd && (() => {
                      const minX = Math.min(selectionStart.displayX, selectionEnd.displayX)
                      const maxX = Math.max(selectionStart.displayX, selectionEnd.displayX)
                      const minY = Math.min(selectionStart.displayY, selectionEnd.displayY)
                      const maxY = Math.max(selectionStart.displayY, selectionEnd.displayY)
                      return <div className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none selection-overlay" style={{ right: `${minX}px`, top: `${minY}px`, width: `${maxX - minX}px`, height: `${maxY - minY}px` }} />
                    })()}
                    {/* Selected Rectangle */}
                    {selectionRect && (() => {
                      const scale = imageZoom / 100
                      const dX = selectionRect.x * scale, dY = selectionRect.y * scale
                      const dW = selectionRect.width * scale, dH = selectionRect.height * scale
                      return (
                        <div className="absolute border-4 border-green-500 bg-green-500/10 pointer-events-none animate-pulse selection-overlay" style={{ right: `${dX}px`, top: `${dY}px`, width: `${dW}px`, height: `${dH}px` }}>
                          <div className="absolute -top-8 right-0 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">✓ אזור נבחר - לחץ "זהה אזור"</div>
                        </div>
                      )
                    })()}
                    {isSelectionMode && !selectionRect && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse">
                        <span className="material-symbols-outlined text-base">crop_free</span><span>גרור לבחירת אזור</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-full bg-surface rounded-lg">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-9xl text-on-surface/20 block mb-4">description</span>
                      <p className="text-on-surface/60">אין תמונה זמינה</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Resizable Divider */}
              <div className={`relative flex items-center justify-center hover:bg-primary/10 transition-colors ${layoutOrientation === 'horizontal' ? 'cursor-row-resize' : 'cursor-col-resize'}`} style={{ width: layoutOrientation === 'horizontal' ? '100%' : '8px', height: layoutOrientation === 'horizontal' ? '8px' : 'auto', flexShrink: 0, userSelect: 'none', backgroundColor: isResizing ? 'rgba(107, 93, 79, 0.2)' : 'transparent' }} onMouseDown={handleResizeStart}>
                <div className="absolute bg-surface-variant rounded-full" style={{ width: layoutOrientation === 'horizontal' ? '12px' : '1px', height: layoutOrientation === 'horizontal' ? '1px' : '12px' }}></div>
              </div>
              {/* Text Editor Side */}
              <div className="flex flex-col overflow-auto p-4 editor-container" style={{ flex: 1 }}>
                {twoColumns ? (
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-2 px-2">
                        <span className="material-symbols-outlined text-primary text-sm">article</span>
                        <span className="text-sm font-bold text-on-surface">{rightColumnName}</span>
                      </div>
                      <textarea data-column="right" value={rightColumn} onChange={(e) => handleColumnChange('right', e.target.value)} onFocus={() => setActiveTextarea('right')} placeholder={`טקסט ${rightColumnName}...`} style={{ fontFamily: selectedFont }} className="flex-1 p-4 bg-white border-2 border-surface-variant rounded-lg resize-none focus:outline-none focus:border-primary text-lg leading-relaxed" dir="rtl" />
                    </div>
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-2 px-2">
                        <span className="material-symbols-outlined text-primary text-sm">article</span>
                        <span className="text-sm font-bold text-on-surface">{leftColumnName}</span>
                      </div>
                      <textarea data-column="left" value={leftColumn} onChange={(e) => handleColumnChange('left', e.target.value)} onFocus={() => setActiveTextarea('left')} placeholder={`טקסט ${leftColumnName}...`} style={{ fontFamily: selectedFont }} className="flex-1 p-4 bg-white border-2 border-surface-variant rounded-lg resize-none focus:outline-none focus:border-primary text-lg leading-relaxed" dir="rtl" />
                    </div>
                  </div>
                ) : (
                  <textarea value={content} onChange={(e) => handleAutoSave(e.target.value)} onFocus={() => setActiveTextarea(null)} placeholder="התחל להקליד את הטקסט מהעמוד כאן..." style={{ fontFamily: selectedFont }} className="w-full h-full p-4 bg-white border-2 border-surface-variant rounded-lg resize-none focus:outline-none focus:border-primary text-lg leading-relaxed" dir="rtl" />
                )}
              </div>
            </div>
            {/* Stats Bar */}
            <div className="px-4 py-3 border-t border-surface-variant bg-surface/50">
              <div className="flex items-center justify-between text-sm text-on-surface/60">
                <div className="flex items-center gap-4">
                  {twoColumns ? (<><span>ימין: {rightColumn.length} תווים</span><span>שמאל: {leftColumn.length} תווים</span></>) : (<><span>תווים: {content.length}</span><span>מילים: {content.trim() ? content.trim().split(/\s+/).length : 0}</span><span>שורות: {content.split('\n').length}</span></>)}
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="material-symbols-outlined text-sm">check_circle</span><span>נשמר אוטומטית</span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Find & Replace Dialog */}
        {showFindReplace && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowFindReplace(false)}>
            <div className="glass-strong rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">find_replace</span><span>חיפוש והחלפה</span>
                </h2>
                <button onClick={() => setShowFindReplace(false)} className="text-on-surface/50 hover:text-on-surface">
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">חפש:</label>
                  <input type="text" value={findText} onChange={(e) => setFindText(e.target.value)} placeholder="הזן טקסט לחיפוש..." className="w-full px-4 py-3 bg-white border-2 border-surface-variant rounded-lg focus:outline-none focus:border-primary" dir="rtl" autoFocus />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setFindText(findText + '\\n')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300">\n (אנטר)</button>
                    <button onClick={() => setFindText(findText + '\\t')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300">\t (טאב)</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">החלף ב:</label>
                  <input type="text" value={replaceText} onChange={(e) => setReplaceText(e.target.value)} placeholder="הזן טקסט חדש..." className="w-full px-4 py-3 bg-white border-2 border-surface-variant rounded-lg focus:outline-none focus:border-primary" dir="rtl" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setReplaceText(replaceText + '\\n')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300">\n (אנטר)</button>
                    <button onClick={() => setReplaceText(replaceText + '\\t')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300">\t (טאב)</button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => handleFindReplace(false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-accent font-bold">
                    <span className="material-symbols-outlined">search</span><span>החלף ראשון</span>
                  </button>
                  <button onClick={() => handleFindReplace(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">
                    <span className="material-symbols-outlined">find_replace</span><span>החלף הכל</span>
                  </button>
                </div>
                <button onClick={() => setShowFindReplace(false)} className="w-full px-4 py-3 border-2 border-surface-variant text-on-surface rounded-lg hover:bg-surface">ביטול</button>
              </div>
            </div>
          </div>
        )}

        {/* Split Dialog */}
        {showSplitDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-strong rounded-2xl p-8 max-w-md w-full border-2 border-primary">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-4xl text-primary">splitscreen</span>
                <div><h3 className="text-2xl font-bold text-on-surface">פיצול עמוד</h3><p className="text-sm text-on-surface/60">חלק את העמוד לשני חלקים</p></div>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-3">בחר סוג פיצול:</label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-surface/50" style={{ borderColor: splitMode === 'content' ? '#6b5d4f' : '#e7e0d8' }}>
                      <input type="radio" name="splitMode" value="content" checked={splitMode === 'content'} onChange={(e) => setSplitMode(e.target.value)} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-primary text-sm">splitscreen</span><span className="font-bold text-on-surface">פיצול תוכן</span></div>
                        <p className="text-xs text-on-surface/70">העמוד מכיל שני חלקים שונים</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-surface/50" style={{ borderColor: splitMode === 'visual' ? '#6b5d4f' : '#e7e0d8' }}>
                      <input type="radio" name="splitMode" value="visual" checked={splitMode === 'visual'} onChange={(e) => setSplitMode(e.target.value)} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-blue-600 text-sm">visibility</span><span className="font-bold text-on-surface">חלוקה ויזואלית</span></div>
                        <p className="text-xs text-on-surface/70">רק לנוחות העריכה</p>
                      </div>
                    </label>
                  </div>
                </div>
                {splitMode === 'content' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-2">שם חלק 1 (ימין):</label>
                      <input type="text" value={rightColumnName} onChange={(e) => setRightColumnName(e.target.value)} className="w-full px-4 py-2 border-2 border-surface-variant rounded-lg focus:outline-none focus:border-primary bg-white" placeholder="לדוגמה: טור ראשי" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-2">שם חלק 2 (שמאל):</label>
                      <input type="text" value={leftColumnName} onChange={(e) => setLeftColumnName(e.target.value)} className="w-full px-4 py-2 border-2 border-surface-variant rounded-lg focus:outline-none focus:border-primary bg-white" placeholder="לדוגמה: הערות" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={confirmSplit} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-accent font-bold">
                  <span className="material-symbols-outlined">splitscreen</span><span>פצל עמוד</span>
                </button>
                <button onClick={() => setShowSplitDialog(false)} className="flex-1 px-4 py-3 border-2 border-surface-variant text-on-surface rounded-lg hover:bg-surface">ביטול</button>
              </div>
            </div>
          </div>
        )}


        {/* Info Dialog */}
        {showInfoDialog && (() => {
          const instructions = getEditingInstructions()
          return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowInfoDialog(false)}>
              <div className="glass-strong rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-3xl">info</span><span>{instructions.title}</span>
                  </h2>
                  <button onClick={() => setShowInfoDialog(false)} className="text-on-surface/50 hover:text-on-surface">
                    <span className="material-symbols-outlined text-3xl">close</span>
                  </button>
                </div>
                <div className="space-y-6">
                  {instructions.sections.map((section, idx) => (
                    <div key={idx} className="bg-surface/30 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">check_circle</span>{section.title}
                      </h3>
                      <ul className="space-y-2">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-on-surface/80">
                            <span className="material-symbols-outlined text-sm text-primary mt-0.5">arrow_left</span><span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowInfoDialog(false)} className="w-full mt-6 px-4 py-3 bg-primary text-white rounded-lg hover:bg-accent font-bold">הבנתי, בואו נתחיל!</button>
              </div>
            </div>
          )
        })()}

        {/* Settings Sidebar */}
        {showSettings && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowSettings(false)} />
            <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined">settings</span>הגדרות OCR
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Gemini API Key <span className="text-gray-400 text-xs font-normal">(אופציונלי)</span></label>
                  <p className="text-xs text-gray-600 mb-3">יש מפתח ברירת מחדל. אם תרצה להשתמש במפתח שלך, <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">קבל מפתח חינם כאן</a></p>
                  <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="השאר ריק לשימוש במפתח ברירת מחדל" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
                  {userApiKey ? <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span>משתמש במפתח שלך</p> : <p className="text-xs text-blue-600 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">info</span>משתמש במפתח ברירת מחדל</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">בחירת מודל</label>
                  <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (מומלץ)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-3-pro-preview">Gemini 3 Pro (ניסיוני)</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-900">פרומפט מותאם אישית</label>
                    <button onClick={resetPrompt} className="text-xs text-blue-600 hover:underline">איפוס לברירת מחדל</button>
                  </div>
                  <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono resize-none" dir="ltr" />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-base">lightbulb</span>טיפים</h3>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• יש מפתח ברירת מחדל - אין צורך להזין מפתח</li>
                    <li>• 2.5 Flash - מהיר וזול, מומלץ לרוב המקרים</li>
                    <li>• פרומפט באנגלית מייצר תוצאות טובות יותר</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <button onClick={saveSettings} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                  <span className="material-symbols-outlined">save</span>שמור הגדרות
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
