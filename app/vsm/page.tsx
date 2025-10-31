"use client";
import { useState, useRef } from "react";

// ---------- Types ----------
type ChatResp = { reply: string; state?: any; controls?: any };

// Minimal dataset shape used on this page.
// If you already have a project-wide type, replace this with your own.
type Process = {
  id: string;
  name: string;
  cycleTimeSec?: number;
  changeoverSec?: number;
  uptimePct?: number;
  wipUnits?: number;
};

type VSMDataset = {
  customerDemandPerDay?: number;
  throughputPerDay?: number;
  taktTimeSec?: number;
  leadTimeSec?: number;
  vaTimeSec?: number;
  nvaTimeSec?: number;
  processes: Process[];
};

// SlotMap returned by /api/vsm-csv (partial is fine)
type SlotMap = {
  process_name?: string;
  demand_per_day?: number;
  throughput_per_day?: number;
  takt_time_s?: number;
  cycle_time_s?: number;
  changeover_time_s?: number;
  uptime_pct?: number;
  defect_rate_pct?: number;
  purchase_rate_pct?: number;
  wip_units?: number;
  shift_hours?: number;
  shift_count?: number;
  lead_time_s?: number;
  va_time_s?: number;
  nva_time_s?: number;
  process_steps?: { name: string }[];
};

// ---------- Helpers ----------
function mergeSlotMapIntoDataset(s: Partial<SlotMap>, ds: VSMDataset): VSMDataset {
  const next: VSMDataset = { ...ds };

  if (s.demand_per_day != null) next.customerDemandPerDay = s.demand_per_day;
  if (s.throughput_per_day != null) next.throughputPerDay = s.throughput_per_day;

  // Prefer structured steps if provided
  if (s.process_steps?.length) {
    next.processes = s.process_steps.map((p, i) => ({
      id: `P${i + 1}`,
      name: p.name,
    }));
  } else if ((!next.processes || next.processes.length === 0) && s.process_name) {
    next.processes = [{ id: "P1", name: s.process_name }];
  } else {
    next.processes = next.processes || [];
  }

  // If there’s a single process, map flat fields onto it
  if (next.processes.length === 1) {
    const p0: Process = { ...next.processes[0] };
    if (s.cycle_time_s != null) p0.cycleTimeSec = s.cycle_time_s;
    if (s.changeover_time_s != null) p0.changeoverSec = s.changeover_time_s;
    if (s.uptime_pct != null) p0.uptimePct = s.uptime_pct;
    if (s.wip_units != null) p0.wipUnits = s.wip_units;
    next.processes[0] = p0;
  }

  // Optional dataset-level times
  if (s.takt_time_s != null) next.taktTimeSec = s.takt_time_s;
  if (s.lead_time_s != null) next.leadTimeSec = s.lead_time_s;
  if (s.va_time_s != null) next.vaTimeSec = s.va_time_s;
  if (s.nva_time_s != null) next.nvaTimeSec = s.nva_time_s;

  return next;
}

// ---------- Component ----------
export default function VsmPage() {
  const [log, setLog] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [dataset, setDataset] = useState<VSMDataset>({ processes: [] });
  const [guidedMode, setGuidedMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send(body: Record<string, any>) {
    const r = await fetch("/api/vsm-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await r.json()) as ChatResp;
    setLog((L) => [...L, `Assistant: ${data.reply}`]);
  }

  async function onSend() {
    const text = input.trim();
    if (!text) return;
    setLog((L) => [...L, `User: ${text}`]);
    setInput("");
    if (guidedMode) {
      await send({ text });
    } else {
      // If you have another chat route, call it here. For now, reuse guided endpoint.
      await send({ text });
    }
  }

  async function accept() {
    setLog((L) => [...L, "User: confirm"]);
    await send({ action: "accept", text: "confirm" });
  }

  async function setSteps() {
    const text = prompt("Comma-separated steps (e.g., Cut, Assemble, Inspect)");
    if (!text) return;
    setLog((L) => [...L, `User: set_steps → ${text}`]);
    await send({ action: "set_steps", text });
  }

  async function setFields() {
    const text = prompt("Comma-separated fields (e.g., takt_time_s, cycle_time_s)");
    if (!text) return;
    setLog((L) => [...L, `User: set_fields → ${text}`]);
    await send({ action: "set_fields", text });
  }

  // ---- Server CSV → dataset flow (preferred) ----
  async function uploadCsvThroughApi(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/vsm-csv", { method: "POST", body: fd });
      const data = await res.json(); // { ok, extracted, missing }
      if (!data?.ok) {
        setLog((L) => [...L, "System: CSV parse failed on server."]);
        return;
      }
      setDataset((prev) => mergeSlotMapIntoDataset(data.extracted, prev));
      setLog((L) => [
        ...L,
        "System: CSV parsed on server and merged into dataset.",
        `System: Missing fields → ${data.missing?.length ? data.missing.join(", ") : "none"}`,
      ]);
    } catch (err) {
      setLog((L) => [...L, "System: Server CSV parse failed."]);
      // Optional: call your local CSV parser as a fallback here.
    }
  }

  async function guidedStart() {
    setGuidedMode(true);
    const r = await fetch("/api/vsm-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }), // opening prompt
    });
    const data = (await r.json()) as ChatResp;
    setLog((L) => [...L, `Assistant: ${data.reply}`]);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Guided VSM Collector</h1>

      <div className="flex gap-2 flex-wrap">
        <button className="border rounded px-3 py-2" onClick={guidedStart}>
          Start guided mode
        </button>
        <button className="border rounded px-3 py-2" onClick={accept}>
          Confirm
        </button>
        <button className="border rounded px-3 py-2" onClick={setSteps}>
          Edit Steps
        </button>
        <button className="border rounded px-3 py-2" onClick={setFields}>
          Edit Fields
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files && uploadCsvThroughApi(e.target.files[0])}
        />
        <button className="border rounded px-3 py-2" onClick={() => fileRef.current?.click()}>
          Upload CSV
        </button>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder='Type… e.g. "Discrete Manufacturing (Assembly)"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
        />
        <button className="border rounded px-3 py-2" onClick={onSend}>
          Send
        </button>
      </div>

      <pre className="whitespace-pre-wrap border rounded p-3 min-h-[160px]">
        {log.join("\n\n")}
      </pre>

      <div>
        <h2 className="text-lg font-medium mt-2 mb-1">Current dataset</h2>
        <pre className="whitespace-pre-wrap border rounded p-3">
          {JSON.stringify(dataset, null, 2)}
        </pre>
      </div>
    </div>
  );
}
