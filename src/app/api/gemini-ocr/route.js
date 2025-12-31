import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const DEFAULT_PROMPT = `The text is in Hebrew, written in Rashi script (traditional Hebrew font).

Transcription guidelines:
- Transcribe exactly what you see, letter by letter
- Do NOT add nikud (vowel points) unless they appear in the image
- Do NOT correct or "fix" words to make them more meaningful
- Preserve the exact spelling, even if words seem unusual or abbreviated
- In Rashi script: Final Mem (ם) looks like Samekh (ס), and Alef (א) looks like Het (ח) - be careful
- Preserve all line breaks and spacing
- Return only the Hebrew text without explanations`

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'לא מחובר' }, { status: 401 })
    }

    const body = await request.json()
    const { imageBase64, model, userApiKey, customPrompt } = body

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'חסרה תמונה' }, { status: 400 })
    }

    // Use user's API key or default
    const apiKey = userApiKey || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'חסר API key של Gemini' }, { status: 400 })
    }

    const selectedModel = model || 'gemini-2.5-flash'
    const prompt = customPrompt || DEFAULT_PROMPT

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Gemini API error:', errorData)
      return NextResponse.json({ 
        success: false, 
        error: errorData.error?.message || `Gemini API error: ${response.status}` 
      }, { status: response.status })
    }

    const data = await response.json()
    
    // Extract text from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    if (!text) {
      return NextResponse.json({ success: false, error: 'לא התקבל טקסט מ-Gemini' }, { status: 500 })
    }

    return NextResponse.json({ success: true, text: text.trim() })
  } catch (error) {
    console.error('Gemini OCR error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
