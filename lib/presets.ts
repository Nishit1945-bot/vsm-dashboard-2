// lib/presets.ts
export type IndustryPreset = {
  name: string;
  suggested_steps: { name: string; step_type?: "VA" | "NVA" | "Support" }[];
  // Use keyof SlotMap so the field names stay in sync with slotSchema
  suggested_fields: (keyof import("./slotSchema").SlotMap)[];
};

export const PRESETS: IndustryPreset[] = [
  {
    name: "Discrete Manufacturing (Assembly)",
    suggested_steps: [
      { name: "Incoming Materials", step_type: "Support" },
      { name: "Cutting/Machining", step_type: "VA" },
      { name: "Sub-Assembly", step_type: "VA" },
      { name: "Final Assembly", step_type: "VA" },
      { name: "Inspection", step_type: "Support" },
      { name: "Packaging", step_type: "Support" },
    ],
    suggested_fields: [
      "process_name","demand_per_day","throughput_per_day",
      "takt_time_s","cycle_time_s","changeover_time_s","uptime_pct",
      "defect_rate_pct","wip_units","shift_hours","shift_count",
      "lead_time_s","va_time_s","nva_time_s"
    ],
  },
  {
    name: "Food & Beverage",
    suggested_steps: [
      { name: "Prep & Mixing", step_type: "VA" },
      { name: "Cooking/Processing", step_type: "VA" },
      { name: "Filling", step_type: "VA" },
      { name: "Packaging", step_type: "Support" },
      { name: "Cold Storage", step_type: "NVA" },
    ],
    suggested_fields: [
      "process_name","demand_per_day","throughput_per_day",
      "takt_time_s","cycle_time_s","changeover_time_s","uptime_pct",
      "defect_rate_pct","wip_units","shift_hours","shift_count","lead_time_s"
    ],
  },
  {
    name: "Pharma",
    suggested_steps: [
      { name: "Compounding", step_type: "VA" },
      { name: "Filtration", step_type: "VA" },
      { name: "Filling", step_type: "VA" },
      { name: "Inspection", step_type: "Support" },
      { name: "Sterilization", step_type: "Support" },
      { name: "Quarantine", step_type: "NVA" },
    ],
    suggested_fields: [
      "process_name","demand_per_day","throughput_per_day",
      "cycle_time_s","changeover_time_s","uptime_pct",
      "defect_rate_pct","wip_units","lead_time_s"
    ],
  },
];
