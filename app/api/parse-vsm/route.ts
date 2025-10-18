import { generateObject } from "ai"
import { z } from "zod"

export const runtime = "nodejs"

const vsmSchema = z.object({
  customerDemandPerDay: z.number().positive().optional(),
  processes: z.array(
    z.object({
      name: z.string(),
      cycleTimeSec: z.number().nonnegative().optional(),
      changeoverSec: z.number().nonnegative().optional(),
      uptimePct: z.number().min(0).max(100).optional(),
      wipUnits: z.number().nonnegative().optional(),
    }),
  ),
  missingFields: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const { text, userId } = await req.json()

    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const result = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: vsmSchema,
      prompt: `Parse the following text into VSM data. Extract:
- Customer demand per day (number)
- Process steps with their names
- Cycle times (C/T) in seconds
- Changeover times (C/O) in seconds  
- Uptime percentages
- WIP (work-in-progress) inventory between steps

Text: ${text}

If any fields are missing or unclear, list them in missingFields array.`,
    })

    return Response.json(result.object)
  } catch (error: any) {
    console.error("[v0] Parse VSM API error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
