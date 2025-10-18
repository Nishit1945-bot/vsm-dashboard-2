import { streamText } from "ai"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const systemPrompt = `You are an expert Value Stream Mapping (VSM) assistant for foundry operations. Your role is to:

1. Guide users through collecting VSM data by asking targeted questions
2. Parse and validate their inputs for:
   - Customer demand per day (units/day)
   - Process steps (in sequential order)
   - Cycle time (C/T) for each process in seconds
   - Changeover time (C/O) for each process in seconds
   - Uptime percentage for each process
   - Work-in-progress (WIP) inventory between steps

3. When users provide data:
   - Extract numerical values and process names
   - Validate completeness and consistency
   - Ask for missing information
   - Confirm understanding

4. Be conversational but focused on gathering accurate VSM data
5. If users upload files or provide bulk data, help them parse and validate it
6. Always maintain a professional, helpful tone

Remember: The goal is to collect complete, accurate data to generate a deterministic VSM diagram.`

export async function POST(req: Request) {
  try {
    const { messages, chatId, userId } = await req.json()

    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const supabase = await getSupabaseServerClient()

    // Verify user owns this chat
    const { data: chat } = await supabase.from("chats").select("user_id").eq("id", chatId).single()

    if (!chat || chat.user_id !== userId) {
      return new Response("Forbidden", { status: 403 })
    }

    // Stream AI response
    const result = streamText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role === "system" ? "assistant" : m.role,
        content: m.text || m.content,
      })),
      temperature: 0.7,
      maxTokens: 500,
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error("[v0] Chat API error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
