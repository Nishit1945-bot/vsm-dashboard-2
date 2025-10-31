// lib/tone.ts

export const HUMAN_TONE = {
  opening: (userName?: string) =>
    `Thanks${userName ? `, ${userName}` : ""}! To tailor the VSM, which industry or process are we mapping? (e.g., "Discrete assembly", "Food & Beverage bottling", "Pharma filling")`,

  propose: (industry: string, stepsList: string, fieldsList: string) =>
    `Got it — **${industry}**. Here’s a sensible starting point.\n\n**Steps:** ${stepsList}\n\n**Key facts to capture:** ${fieldsList}\n\nWould you like to **add/remove** any steps or fields before we start collecting values?`,

  confirm: `Perfect. I’ll capture the agreed steps and fields. Next, I’ll ask short questions to fill them in. You can also paste values in natural language — I’ll handle units and shifts.`,

  askOne: (label: string, hint?: string) =>
    `**${label}**${hint ? ` (${hint})` : ""}? (You can say things like “240/day”, “takt 45s”, “two 8h shifts”.)`,

  recap: (obj: any) =>
    `Here’s what I’ve captured so far:\n` +
    "```json\n" +
    JSON.stringify(obj, null, 2) +
    "\n```" +
    `\nSay “continue” or provide updates for any field.`,

  csvOffer: `If you prefer, upload a CSV — I’ll auto-fill the fields and only ask for anything missing.`,
};
