// app/api/intent/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";

// Use the Node runtime so we can call external APIs comfortably.
export const runtime = "nodejs";

// If you prefer ENV var names differently, adjust here.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Types the client will consume (also exported in lib/nlu/intent-schema.ts later) ---
type Intent =
  | "give_project_name"
  | "greeting"
  | "question"
  | "smalltalk"
  | "other";

export type IntentResult = {
  intent: Intent;
  project_name: string | null;
  language: string; // IETF tag (best-effort), e.g., "en", "fr", "hi"
  confidence: number; // 0..1
  assistant_message: string; // already localized
};

// --- POST handler ---
export async function POST(req: NextRequest) {
  try {
    const { text, knownProjects = [] } = await req.json();

    if (typeof text !== "string" || !text.trim()) {
      return json(
        400,
        errorPayload("Invalid 'text' in request body (expected non-empty string)")
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return json(
        500,
        errorPayload("Server missing OPENAI_API_KEY; set it in your environment")
      );
    }

    // System: judge by criteria (no keyword lists). Ask for *JSON* back.
    const system = `
You are an intent router for a project-intake chatbot.
Do NOT rely on fixed keyword lists. Judge by criteria.

Decide whether the user's message contains a plausible *project name*.

Criteria for a valid project name (apply all):
- Contains at least one letter or digit.
- Length after trimming is between 2 and 80 characters.
- Not obviously a full request/question/sentence about tasks (e.g., starts with a verb, ends with '?', multiple verbs).
- If it resembles one of the known projects (given), prefer "give_project_name" but lower confidence if unsure.

Then produce a short assistant_message in the user's language:
- If valid: acknowledge and state we will proceed.
- If not valid: politely ask for JUST the project name and include 2–3 realistic examples (do not mention rules).
Return *strict JSON* only.
`.trim();

    const user = `
User text:
${text}

Known projects (optional, for resemblance only):
${knownProjects.length ? knownProjects.join(" | ") : "(none)"}

Return JSON with shape:
{
  "intent": "give_project_name" | "greeting" | "question" | "smalltalk" | "other",
  "project_name": string | null,
  "language": string,
  "confidence": number, // 0..1, lower if uncertain
  "assistant_message": string
}
`.trim();

    // Ask GPT-4.1-mini to produce a JSON object (no extra text).
    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    // Extract raw JSON text reliably from the Responses API.
    const textOut =
  // @ts-ignore: allow flexible access to the unified output
  resp.output_text ??
    ((resp.output &&
      Array.isArray(resp.output) &&
      resp.output[0]?.content?.[0]?.type === "output_text" &&
      resp.output[0]?.content?.[0]?.text) ||
    "");

    if (!textOut) {
      return json(
        502,
        errorPayload("Model returned no content. Try again or check model/version.")
      );
    }

    // Parse the model's JSON.
    let parsed: IntentResult;
    try {
      parsed = JSON.parse(textOut) as IntentResult;
    } catch (e) {
      return json(
        502,
        errorPayload("Model output was not valid JSON. Consider lowering temperature.")
      );
    }

    // Server-side sanity checks to avoid accidental false positives.
    parsed.project_name =
      typeof parsed.project_name === "string"
        ? parsed.project_name.trim()
        : null;

    if (parsed.project_name) {
      const pn = parsed.project_name;
      const tooShort = pn.length < 2;
      const tooLong = pn.length > 80;
      const hasAlphaNum = /[A-Za-z0-9]/.test(pn);
      const looksQuestion = /[?？！]$/.test(pn);
      const looksSentence =
        /(^\s*(please|can you|could you|show|tell|what|when|how|where|why)\b)/i.test(
          pn
        ) || /\.\s*$/.test(pn);

      if (
        tooShort ||
        tooLong ||
        !hasAlphaNum ||
        looksQuestion ||
        looksSentence
      ) {
        // Demote to not-a-name
        parsed.intent =
          parsed.intent === "give_project_name" ? "other" : parsed.intent;
        parsed.project_name = null;
        parsed.confidence = Math.min(parsed.confidence, 0.4);
      }
    }

    // Ensure fields exist.
    if (
      !parsed.intent ||
      typeof parsed.assistant_message !== "string" ||
      typeof parsed.confidence !== "number" ||
      typeof parsed.language !== "string"
    ) {
      return json(
        502,
        errorPayload("Model JSON missing required fields. Check prompt/schema.")
      );
    }

    return json(200, parsed);
  } catch (err: any) {
    return json(
      500,
      errorPayload(
        `Unhandled server error: ${
          typeof err?.message === "string" ? err.message : String(err)
        }`
      )
    );
  }
}

// --- helpers ---
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorPayload(message: string) {
  return { error: true, message };
}
