import { NextRequest, NextResponse as json } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    // Simple mock intent detection
    const intent =
      text.toLowerCase().includes("vsm") || text.toLowerCase().includes("map")
        ? "collect_vsm_data"
        : "other";

    const response = {
      intent,
      project_name: null,
      language: "en",
      confidence: 0.5,
      assistant_message:
        intent === "collect_vsm_data"
          ? "Got it, let's start collecting VSM data."
          : "The GPT model is currently disconnected.",
    };

    return json.json(response, { status: 200 });
  } catch (error: any) {
    console.error("[Intent API Error]:", error);
    return json.json({ error: error.message }, { status: 500 });
  }
}
