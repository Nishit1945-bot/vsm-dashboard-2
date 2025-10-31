import { z } from "zod";

export const SlotMapSchema = z.object({
  process_name: z.string().optional(),
  industry: z.string().optional(),

  // New: structured process steps
  process_steps: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    step_type: z.enum(["VA","NVA","Support"]).optional(),
    average_cycle_time_s: z.number().nonnegative().optional(),
  })).optional(),

  demand_per_day: z.number().int().nonnegative().optional(),           // items/day
  throughput_per_day: z.number().int().nonnegative().optional(),       // items/day
  takt_time_s: z.number().nonnegative().optional(),                    // s
  cycle_time_s: z.number().nonnegative().optional(),                   // s
  changeover_time_s: z.number().nonnegative().optional(),              // s
  uptime_pct: z.number().min(0).max(100).optional(),                   // %
  defect_rate_pct: z.number().min(0).max(100).optional(),              // %
  purchase_rate_pct: z.number().min(0).max(100).optional(),            // %
  wip_units: z.number().nonnegative().optional(),
  shift_hours: z.number().positive().optional(),
  shift_count: z.number().int().positive().optional(),
  lead_time_s: z.number().nonnegative().optional(),                    // s
  va_time_s: z.number().nonnegative().optional(),                      // s
  nva_time_s: z.number().nonnegative().optional(),                     // s
});

export type SlotMap = z.infer<typeof SlotMapSchema>;
