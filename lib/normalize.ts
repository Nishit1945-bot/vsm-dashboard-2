// lib/normalize.ts

const WORD_TO_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

export function parseNumberLoose(s: string): number | null {
  if (!s) return null;
  const w = s.toLowerCase().trim();
  if (WORD_TO_NUM[w] != null) return WORD_TO_NUM[w];
  const cleaned = s.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function toSeconds(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith("s")) return value;
  if (u.startsWith("min")) return value * 60;
  if (u.startsWith("h")) return value * 3600;
  if (u.includes("day")) return value * 86400;
  return value;
}

// Supports: "1h 20m", "90 sec", "2.5 hours", "45s", "3 days", etc.
export function parseDurationToSeconds(text: string): number | null {
  const t = (text || "")
    .toLowerCase()
    .replace(/seconds?|secs?/g, "s")
    .replace(/minutes?|mins?/g, "min")
    .replace(/hours?|hrs?/g, "h")
    .replace(/days?/g, "day");

  const re = /([0-9.]+)\s*(day|h|min|s)/g;
  let m: RegExpExecArray | null, total = 0, matched = false;

  while ((m = re.exec(t))) {
    total += toSeconds(Number(m[1]), m[2]);
    matched = true;
  }
  if (matched) return total;

  const m2 = t.match(/([0-9.]+)(day|h|min|s)/);
  return m2 ? toSeconds(Number(m2[1]), m2[2]) : null;
}

export function parsePerDay(text: string): number | null {
  const m = (text || "")
    .toLowerCase()
    .match(/([0-9][0-9,\.]*)\s*(\/\s*day|per\s*day|daily)/);
  if (m) {
    const n = parseNumberLoose(m[1]);
    return n ?? null;
  }
  return null;
}

export function parsePercent(text: string): number | null {
  const m = (text || "").match(/([0-9][0-9,\.]*)\s*%/);
  return m ? (parseNumberLoose(m[1]) ?? null) : null;
}

export function parseShiftCount(text: string): number | null {
  const m1 = text.match(/([0-9]+)\s*shifts?/i)?.[1];
  if (m1) return Number(m1);
  const m2 = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*shifts?\b/i)?.[1];
  if (m2) return WORD_TO_NUM[m2.toLowerCase()];
  return null;
}
