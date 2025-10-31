// app/api/vsm-csv/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { SlotMapSchema } from "@/lib/slotSchema";
import {
  parseDurationToSeconds,
  parsePercent,
  parsePerDay,
  parseNumberLoose,
} from "@/lib/normalize";

type SlotMap = import("@/lib/slotSchema").SlotMap;

const COLUMN_ALIASES: Record<string, (keyof SlotMap)[]> = {
  process: ["process_name"],
  process_name: ["process_name"],
  takt: ["takt_time_s"],
  takt_time: ["takt_time_s"],
  cycle: ["cycle_time_s"],
  cycle_time: ["cycle_time_s"],
  changeover: ["changeover_time_s"],
  uptime: ["uptime_pct"],
  oee_uptime: ["uptime_pct"],
  defect_rate: ["defect_rate_pct"],
  purchase_rate: ["purchase_rate_pct"],
  demand_per_day: ["demand_per_day"],
  throughput_per_day: ["throughput_per_day"],
  wip: ["wip_units"],
  lead_time: ["lead_time_s"],
  va_time: ["va_time_s"],
  nva_time: ["nva_time_s"],
  shift_hours: ["shift_hours"],
  shifts: ["shift_count"],
  shift_count: ["shift_count"],
};

function normalizeCellToField(field: string, value: string) {
  if (!value) return null;

  if (field.endsWith("_s")) return parseDurationToSeconds(value);
  if (field.endsWith("_pct")) return parsePercent(value) ?? parseNumberLoose(value);
  if (/_per_day$/.test(field)) return parsePerDay(value) ?? parseNumberLoose(value);

  if (field === "wip_units" || field === "shift_count" || field === "shift_hours") {
    return parseNumberLoose(value);
  }
  if (field === "process_name") return String(value).trim();

  return parseNumberLoose(value);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const rows = parse(buf, { columns: true, skip_empty_lines: true }) as Record<string, string>[];

  const row = rows[0] ?? {};
  const extracted: Partial<SlotMap> = {};

  for (const [col, raw] of Object.entries(row)) {
    const key = col.toLowerCase().replace(/\s+/g, "_");
    const targets = COLUMN_ALIASES[key] ?? [];
    for (const f of targets) {
      const v = normalizeCellToField(f, String(raw));
      if (v != null) (extracted as any)[f] = v;
    }
  }

  // validate partial
  const validated = SlotMapSchema.partial().parse(extracted);

  // common fields we like to have
  const TYPICAL: (keyof SlotMap)[] = [
    "process_name","demand_per_day","throughput_per_day","takt_time_s","cycle_time_s",
    "changeover_time_s","uptime_pct","defect_rate_pct","purchase_rate_pct","wip_units",
    "shift_hours","shift_count","lead_time_s","va_time_s","nva_time_s"
  ];
  const missing = TYPICAL.filter((k) => (validated as any)[k] == null);

  return NextResponse.json({ ok: true, extracted: validated, missing });
}
