import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY
    const MODEL_ID = process.env.HUGGINGFACE_MODEL_ID || 'nishit1945/VSM-LLM'
    
    if (!HUGGINGFACE_API_KEY) {
      console.error('[HF Chat] Missing API key')
      return NextResponse.json(
        { error: 'Hugging Face API key not configured' },
        { status: 500 }
      )
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    const prompt = lastMessage.content || lastMessage.text

    console.log('[HF Chat] Calling model:', MODEL_ID)

    // Call Hugging Face Inference API
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[HF Chat] API Error:', errorText)
      return NextResponse.json(
        { error: `Hugging Face API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Handle response format
    let generatedText = ''
    if (Array.isArray(data) && data.length > 0) {
      generatedText = data[0]?.generated_text || ''
    } else if (data.generated_text) {
      generatedText = data.generated_text
    } else if (data.error) {
      console.error('[HF Chat] Model error:', data.error)
      return NextResponse.json(
        { error: `Model error: ${data.error}` },
        { status: 503 }
      )
    }

    return NextResponse.json({ response: generatedText.trim() })
  } catch (error: any) {
    console.error('[HF Chat] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}