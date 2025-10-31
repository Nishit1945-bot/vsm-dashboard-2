// app/api/vsm-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { SlotMapSchema, type SlotMap } from "@/lib/slotSchema";
import { PRESETS } from "@/lib/presets";
import { HUMAN_TONE } from "@/lib/tone";
import {
  parseDurationToSeconds,
  parsePerDay,
  parsePercent,
  parseShiftCount,
  parseNumberLoose,
} from "@/lib/normalize";

const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const LLM_API_KEY = process.env.LLM_API_KEY!;
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4.1-mini";
const client = new OpenAI({ apiKey: LLM_API_KEY, baseURL: LLM_BASE_URL });

type Phase = "ASK_INDUSTRY" | "PROPOSE" | "CONFIRM_SCHEMA" | "COLLECT" | "DONE";

const SessionSchema = z.object({
  phase: z.custom<Phase>().default("ASK_INDUSTRY"),
  industry: z.string().optional(),
  steps: z
    .array(
      z.object({
        name: z.string(),
        step_type: z.enum(["VA", "NVA", "Support"]).optional(),
      })
    )
    .default([]),
  fields: z.array(z.string()).default([]),
  collected: SlotMapSchema.partial().default({}),
  pendingFields: z.array(z.string()).default([]),
});
type Session = z.infer<typeof SessionSchema>;

// simple in-memory session (can be replaced by Supabase later)
let SESSION: Session = {
  phase: "ASK_INDUSTRY",
  steps: [],
  fields: [],
  collected: {},
  pendingFields: [],
};

function fieldListForPreset(name: string) {
  const p =
    PRESETS.find((x) => x.name.toLowerCase().includes(name.toLowerCase())) ??
    PRESETS[0];
  return p;
}

function proposeFromIndustry(industry: string) {
  const preset = fieldListForPreset(industry);
  return {
    steps: preset.suggested_steps,
    fields: preset.suggested_fields,
  };
}

// Smart extractor for natural-language answers during data collection
function quickParse(text: string): Partial<SlotMap> {
  const out: Partial<SlotMap> = {};
  const t = text.toLowerCase();

  const perDay = parsePerDay(text);
  if (perDay !== null) {
    if (t.includes("demand")) out.demand_per_day = Math.round(perDay);
    else out.throughput_per_day = Math.round(perDay);
  }

  const takt = t.includes("takt") ? parseDurationToSeconds(text) : null;
  if (takt !== null) out.takt_time_s = takt;

  const cycle = t.includes("cycle") ? parseDurationToSeconds(text) : null;
  if (cycle !== null) out.cycle_time_s = cycle;

  const change = t.includes("changeover") ? parseDurationToSeconds(text) : null;
  if (change !== null) out.changeover_time_s = change;

  const uptime = t.includes("uptime") ? parsePercent(text) : null;
  if (uptime !== null) out.uptime_pct = uptime;

  const defect = t.includes("defect") ? parsePercent(text) : null;
  if (defect !== null) out.defect_rate_pct = defect;

  const purchase = t.includes("purchase") ? parsePercent(text) : null;
  if (purchase !== null) out.purchase_rate_pct = purchase;

  const lead = t.includes("lead") ? parseDurationToSeconds(text) : null;
  if (lead !== null) out.lead_time_s = lead;

  const wip = text.match(/\bwip[^0-9]*([0-9][0-9,\.]*)/i)?.[1];
  if (wip) {
    const n = parseNumberLoose(wip);
    if (n !== null) out.wip_units = Math.round(n);
  }

  const shifts = parseShiftCount(text);
  if (shifts !== null) out.shift_count = shifts;

  const shHours = text.match(/([0-9]+(\.[0-9]+)?)\s*(h|hours?)\s*(shift)?/i)?.[1];
  if (shHours) out.shift_hours = Number(shHours);

  return out;
}

export async function POST(req: NextRequest) {
  const { text, action } = (await req.json()) as {
    text?: string;
    action?: "start" | "accept" | "reject" | "continue" | "set_fields" | "set_steps";
  };

  // 1) Ask for industry
  if (SESSION.phase === "ASK_INDUSTRY") {
    if (!text) {
      return NextResponse.json({ reply: HUMAN_TONE.opening() });
    }
    SESSION.industry = text.trim();
    const { steps, fields } = proposeFromIndustry(SESSION.industry);
    SESSION.steps = steps;
    SESSION.fields = fields as string[];
    SESSION.phase = "PROPOSE";

    const stepsList = steps
      .map((s) => `• ${s.name}${s.step_type ? ` (${s.step_type})` : ""}`)
      .join("\n");
    const fieldsList = fields.map((f) => `\`${f}\``).join(", ");

    return NextResponse.json({
      reply: HUMAN_TONE.propose(SESSION.industry, stepsList, fieldsList),
      controls: { canEditSteps: true, canEditFields: true, confirmButtons: ["Looks good", "Edit first"] },
    });
  }

  // 2) Confirm or edit proposed schema
  if (SESSION.phase === "PROPOSE") {
    if (action === "set_steps" && text) {
      const names = text.split(",").map((s) => s.trim()).filter(Boolean);
      SESSION.steps = names.map((n) => ({ name: n }));
      return NextResponse.json({ reply: "Updated steps. Say **confirm** when ready, or edit again." });
    }
    if (action === "set_fields" && text) {
      const names = text.split(",").map((s) => s.trim()).filter(Boolean);
      SESSION.fields = names;
      return NextResponse.json({ reply: "Updated fields. Say **confirm** when ready, or edit again." });
    }
    if (action === "accept" || /^(ok|confirm|looks good|go ahead)$/i.test(text || "")) {
      SESSION.phase = "CONFIRM_SCHEMA";
    } else {
      return NextResponse.json({
        reply: "Tell me which **steps** or **fields** to add/remove, or say **confirm**.",
      });
    }
  }

  // 3) Confirm schema → start collecting
  if (SESSION.phase === "CONFIRM_SCHEMA") {
    SESSION.pendingFields = [...SESSION.fields];
    SESSION.collected = { industry: SESSION.industry, process_steps: SESSION.steps };
    SESSION.phase = "COLLECT";

    const next = SESSION.pendingFields.shift();
    return NextResponse.json({
      reply:
        HUMAN_TONE.confirm +
        "\n\n" +
        HUMAN_TONE.askOne(next ?? "process_name", "short label for the process"),
      state: SESSION,
    });
  }

  // 4) Collecting answers
  if (SESSION.phase === "COLLECT") {
    if (!text) {
      const next = SESSION.pendingFields[0] ?? "process_name";
      return NextResponse.json({ reply: HUMAN_TONE.askOne(next) });
    }

    const parsed = quickParse(text);
    const currentField = SESSION.pendingFields[0];

    // fallback logic for single field answers
    if (currentField && Object.keys(parsed).length === 0) {
      if (currentField.endsWith("_s")) {
        const s = parseDurationToSeconds(text);
        if (s !== null) (parsed as any)[currentField] = s;
      } else if (currentField.endsWith("_pct")) {
        const p = parsePercent(text);
        if (p !== null) (parsed as any)[currentField] = p;
      } else if (/_per_day$/.test(currentField)) {
        const n = parsePerDay(text) ?? parseNumberLoose(text);
        if (n !== null) (parsed as any)[currentField] = Math.round(n);
      } else if (/shift_count/.test(currentField)) {
        const n = parseShiftCount(text) ?? parseNumberLoose(text);
        if (n !== null) (parsed as any)[currentField] = Math.round(n);
      } else {
        const n = parseNumberLoose(text);
        if (n !== null) (parsed as any)[currentField] = n;
        else if (text.trim().length && currentField === "process_name")
          (parsed as any)[currentField] = text.trim();
      }
    }

    Object.assign(SESSION.collected, parsed);

    if (currentField && (SESSION.collected as any)[currentField] != null) {
      SESSION.pendingFields.shift();
    }

    if (SESSION.pendingFields.length === 0) {
      SESSION.phase = "DONE";
      return NextResponse.json({
        reply:
          HUMAN_TONE.recap(SESSION.collected) +
          "\nIf everything looks right, say **save** or tell me any corrections.",
        state: SESSION,
      });
    } else {
      const next = SESSION.pendingFields[0];
      return NextResponse.json({
        reply:
          HUMAN_TONE.recap(SESSION.collected) + "\n\n" + HUMAN_TONE.askOne(next),
        state: SESSION,
      });
    }
  }

  // 5) Done
  return NextResponse.json({
    reply:
      "All set. I’ve captured the VSM facts. You can **upload a CSV** anytime; I’ll auto-fill and only ask for missing pieces.",
  });
}
