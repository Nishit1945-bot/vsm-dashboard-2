import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY
    const MODEL_ID = 'nishit1945/VSM-LLM'
    
    if (!HUGGINGFACE_API_KEY) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 })
    }

    const lastMessage = messages[messages.length - 1]
    const prompt = lastMessage.content || lastMessage.text

    console.log('[HF Chat] Calling your VSM model')
    console.log('[HF Chat] Prompt:', prompt)

    // Call Hugging Face with proper timeout and format
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
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
              max_length: 512,
              temperature: 0.7,
              top_p: 0.9,
              do_sample: true,
              return_full_text: false,
            },
            options: {
              wait_for_model: true,
            },
          }),
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      const responseText = await response.text()
      console.log('[HF Chat] Status:', response.status)
      console.log('[HF Chat] Response:', responseText.substring(0, 200))

      if (!response.ok) {
        const errorData = JSON.parse(responseText)
        
        // Handle model loading
        if (errorData.error && errorData.error.includes('loading')) {
          return NextResponse.json({
            response: "The VSM model is starting up (first use takes ~20 seconds). Please try again in a moment!"
          })
        }

        // Handle rate limiting
        if (response.status === 429) {
          return NextResponse.json({
            response: "The model is busy. Please wait a moment and try again."
          })
        }

        console.error('[HF Chat] Error:', errorData)
        return NextResponse.json({
          response: "I'm having trouble connecting to the VSM model. Let me help you with VSM concepts - what would you like to know?"
        })
      }

      const data = JSON.parse(responseText)
      let generatedText = ''

      // Handle different response formats
      if (Array.isArray(data)) {
        generatedText = data[0]?.generated_text || data[0]?.text || ''
      } else if (data.generated_text) {
        generatedText = data.generated_text
      } else if (data[0]?.generated_text) {
        generatedText = data[0].generated_text
      }

      // Clean up the response
      if (generatedText) {
        // Remove the input prompt if it's repeated
        generatedText = generatedText.replace(prompt, '').trim()
        
        console.log('[HF Chat] Success! Generated:', generatedText.substring(0, 100))
        return NextResponse.json({ response: generatedText })
      }

      console.error('[HF Chat] No text in response:', data)
      return NextResponse.json({
        response: "I'm ready to help with your VSM project! What information do you need?"
      })

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('[HF Chat] Request timeout')
        return NextResponse.json({
          response: "The model took too long to respond. It might be starting up. Please try again!"
        })
      }
      
      throw fetchError
    }
    
  } catch (error: any) {
    console.error('[HF Chat] Exception:', error.message)
    return NextResponse.json({
      response: "I'm here to help with VSM! The model connection is being established. What would you like to know about Value Stream Mapping?"
    })
  }
}