"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"

// Step 1 focus: a fully working, LOCAL (front‑end only) dashboard with:
// - Email login (stored locally)
// - Chat-like guidance to collect VSM fields
// - Uploads: CSV/Excel/Image/Plain text prompt
// - Deterministic VSM graph rendering from provided data
// - Export graph (SVG/PNG) + export derived table (CSV)
// - Auto-save prior chats & datasets to localStorage
//
// Assumptions for step 1:
// - No backend yet. "Always live" will be simulated by local persistence.
// - Model/LLM hooks are stubbed; rule-based prompts guide the user.
// - Determinism: rendering layout is seeded with a hash of the normalized input.
//
// To use in a real app:
// 1) Drop this file into a React (Vite or CRA) project as App.tsx (TypeScript) or App.jsx (JSX with small tweaks)
// 2) Ensure Tailwind CSS is enabled (recommended). If not, replace classNames with plain CSS.
// 3) Install xlsx for Excel parsing: `npm i xlsx`
// 4) Run the dev server and test the flows. Integrate your backend/auth later.

// -------------------- Utility helpers --------------------

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ")
}

// Simple deterministic hash (FNV-1a) for seeding layouts from input
function hashString(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  // convert to positive 31-bit
  return (h >>> 0) & 0x7fffffff
}

// Pseudo-random generator seeded for determinism
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// CSV parser (very light). For production, consider PapaParse.
function parseCSV(raw: string): { headers: string[]; rows: string[][] } {
  const lines = raw.replace(/\r/g, "").split(/\n+/).filter(Boolean)
  if (!lines.length) return { headers: [], rows: [] }
  const headers = lines[0].split(",").map((h) => h.trim())
  const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()))
  return { headers, rows }
}

// Download helpers
function download(filename: string, blob: Blob) {
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

function downloadText(filename: string, text: string) {
  download(filename, new Blob([text], { type: "text/plain;charset=utf-8" }))
}

// -------------------- VSM domain types --------------------

type VSMProcess = {
  id: string
  name: string
  cycleTimeSec?: number // C/T
  changeoverSec?: number // C/O
  uptimePct?: number // %Uptime
  wipUnits?: number
}

type VSMDataset = {
  customerDemandPerDay?: number // used to compute Takt
  processes: VSMProcess[]
}

// Normalize inputs for deterministic hashing
function normalizeDataset(ds: VSMDataset): string {
  const copy = {
    customerDemandPerDay: ds.customerDemandPerDay ?? 0,
    processes: [...ds.processes]
      .map((p) => ({
        id: p.id,
        name: p.name.trim().toLowerCase(),
        cycleTimeSec: p.cycleTimeSec ?? 0,
        changeoverSec: p.changeoverSec ?? 0,
        uptimePct: p.uptimePct ?? 100,
        wipUnits: p.wipUnits ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }
  return JSON.stringify(copy)
}

// -------------------- Sample rule-based question flow --------------------

const REQUIRED_FIELDS = [
  { key: "customerDemandPerDay", label: "Customer demand per day (units/day)", type: "number" },
  { key: "processes", label: "Process steps (comma-separated names in order)", type: "text" },
  {
    key: "cycleTimeSec",
    label: "Cycle time C/T for each process (seconds, comma-separated in same order)",
    type: "text",
  },
  { key: "changeoverSec", label: "Changeover C/O for each process (seconds, comma-separated)", type: "text" },
  { key: "uptimePct", label: "Uptime % for each process (comma-separated)", type: "text" },
  {
    key: "wipUnits",
    label: "WIP between steps (units, comma-separated; length = processes - 1, use 0 if none)",
    type: "text",
  },
] as const

// -------------------- VSM Layout (deterministic) --------------------

function useVSMLayout(ds: VSMDataset, width: number, height: number) {
  const seed = useMemo(() => hashString(normalizeDataset(ds)), [ds])
  const rnd = useMemo(() => mulberry32(seed), [seed])

  const PADDING = 40
  const boxW = Math.max(140, Math.floor((width - 2 * PADDING) / Math.max(1, ds.processes.length)) - 20)
  const boxH = 80
  const y = height / 2 - boxH / 2

  const nodes = ds.processes.map((p, idx) => {
    // Evenly spaced x positions, tiny deterministic jitter (but consistent for same input)
    const step = (width - 2 * PADDING - boxW) / Math.max(1, ds.processes.length - 1)
    const jitter = (rnd() - 0.5) * 0 // set to 0 to ensure exact same layout for same input
    const x = PADDING + idx * step + jitter
    return { id: p.id, name: p.name, x, y, w: boxW, h: boxH, data: p }
  })

  const edges = nodes.slice(0, -1).map((n, i) => ({
    from: n.id,
    to: nodes[i + 1].id,
    points: [
      { x: n.x + n.w, y: n.y + n.h / 2 },
      { x: nodes[i + 1].x, y: nodes[i + 1].y + nodes[i + 1].h / 2 },
    ],
    wip: ds.processes[i + 1]?.wipUnits ?? 0,
  }))

  const taktSec =
    ds.customerDemandPerDay && ds.customerDemandPerDay > 0
      ? Math.round((8 * 60 * 60) / ds.customerDemandPerDay) // assume 8h shift for Step 1
      : undefined

  return { nodes, edges, taktSec }
}

// -------------------- Main Component --------------------

export default function App() {
  const [email, setEmail] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [chat, setChat] = useState<Array<{ role: "system" | "user"; text: string }>>([])
  const [dataset, setDataset] = useState<VSMDataset>({ processes: [] })
  const [draftDs, setDraftDs] = useState<any>({})
  const [activeTab, setActiveTab] = useState<"chat" | "data" | "preview">("chat")
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  // Load/save local state
  useEffect(() => {
    const savedEmail = localStorage.getItem("vsm_email")
    if (!savedEmail) {
      setShowLogin(true)
    } else {
      setEmail(savedEmail)
    }
    const savedChat = localStorage.getItem("vsm_chat")
    if (savedChat) setChat(JSON.parse(savedChat))
    const savedData = localStorage.getItem("vsm_dataset")
    if (savedData) setDataset(JSON.parse(savedData))
  }, [])

  useEffect(() => {
    localStorage.setItem("vsm_chat", JSON.stringify(chat))
  }, [chat])

  useEffect(() => {
    localStorage.setItem("vsm_dataset", JSON.stringify(dataset))
  }, [dataset])

  // Initial system prompt
  useEffect(() => {
    if (chat.length === 0) {
      setChat([
        {
          role: "system",
          text:
            "Hi! I can generate a Value Stream Mapping (VSM) diagram for your foundry. " +
            "You can upload CSV/Excel, paste a prompt, or answer my questions. " +
            "I'll ask for missing items: customer demand, steps, C/T, C/O, uptime, and WIP.",
        },
      ])
    }
  }, [chat.length])

  // Derived layout
  const { nodes, edges, taktSec } = useVSMLayout(dataset, 1200, 420)

  // ------- Chat logic (rule-based for Step 1) -------
  function nextQuestion() {
    const ds = dataset
    if (!ds.customerDemandPerDay) {
      return REQUIRED_FIELDS[0]
    }
    if (!ds.processes.length) {
      return REQUIRED_FIELDS[1]
    }
    const ctMissing = ds.processes.some((p) => p.cycleTimeSec == null)
    if (ctMissing) return REQUIRED_FIELDS[2]
    const coMissing = ds.processes.some((p) => p.changeoverSec == null)
    if (coMissing) return REQUIRED_FIELDS[3]
    const upMissing = ds.processes.some((p) => p.uptimePct == null)
    if (upMissing) return REQUIRED_FIELDS[4]
    const wipMissing = ds.processes.length > 1 && ds.processes.slice(1).some((p) => p.wipUnits == null)
    if (wipMissing) return REQUIRED_FIELDS[5]
    return null
  }

  function handleUserMessage(raw: string) {
    const text = raw.trim()
    if (!text) return

    setChat((c) => [...c, { role: "user", text }])

    // Try to parse as commands or answers
    const q = nextQuestion()
    if (q) {
      // interpret based on expected field
      let reply = ""
      const ds = { ...dataset } as VSMDataset

      switch (q.key) {
        case "customerDemandPerDay": {
          const num = Number(text.replace(/[^0-9.]/g, ""))
          if (isFinite(num) && num > 0) {
            ds.customerDemandPerDay = num
            setDataset(ds)
            reply = `Got it. Customer demand = ${num} units/day.`
          } else {
            reply = "Please provide a positive number for customer demand per day (e.g., 480)."
          }
          break
        }
        case "processes": {
          const parts = text
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
          if (parts.length) {
            ds.processes = parts.map((name, i) => ({ id: `P${i + 1}`, name }))
            setDataset(ds)
            reply = `Great. I recorded ${parts.length} process steps.`
          } else {
            reply = "Please list the process steps separated by commas (e.g., Melting, Casting, Shakeout, Finishing)."
          }
          break
        }
        case "cycleTimeSec": {
          const nums = text
            .split(",")
            .map((t) => Number(t.trim()))
            .filter((n) => isFinite(n))
          if (nums.length === dataset.processes.length) {
            const ds2 = { ...dataset }
            ds2.processes = ds2.processes.map((p, i) => ({ ...p, cycleTimeSec: nums[i] }))
            setDataset(ds2)
            reply = "Cycle times recorded."
          } else {
            reply = `Please provide ${dataset.processes.length} numbers separated by commas.`
          }
          break
        }
        case "changeoverSec": {
          const nums = text
            .split(",")
            .map((t) => Number(t.trim()))
            .filter((n) => isFinite(n))
          if (nums.length === dataset.processes.length) {
            const ds2 = { ...dataset }
            ds2.processes = ds2.processes.map((p, i) => ({ ...p, changeoverSec: nums[i] }))
            setDataset(ds2)
            reply = "Changeovers recorded."
          } else {
            reply = `Please provide ${dataset.processes.length} numbers separated by commas.`
          }
          break
        }
        case "uptimePct": {
          const nums = text
            .split(",")
            .map((t) => Number(t.trim()))
            .filter((n) => isFinite(n))
          if (nums.length === dataset.processes.length) {
            const ds2 = { ...dataset }
            ds2.processes = ds2.processes.map((p, i) => ({ ...p, uptimePct: nums[i] }))
            setDataset(ds2)
            reply = "Uptime percentages recorded."
          } else {
            reply = `Please provide ${dataset.processes.length} numbers separated by commas.`
          }
          break
        }
        case "wipUnits": {
          // For simplicity, map WIP to downstream process nodes (P2..Pn)
          const expected = Math.max(0, dataset.processes.length - 1)
          const nums = text
            .split(",")
            .map((t) => Number(t.trim()))
            .filter((n) => isFinite(n))
          if (nums.length === expected) {
            const ds2 = { ...dataset }
            ds2.processes = ds2.processes.map((p, i) => ({ ...p, wipUnits: i === 0 ? 0 : nums[i - 1] }))
            setDataset(ds2)
            reply = "WIP values recorded."
          } else {
            reply = `Please provide ${expected} numbers separated by commas (one fewer than number of processes).`
          }
          break
        }
      }

      setChat((c) => [...c, { role: "system", text: reply }])

      // If we just satisfied that question, ask next one automatically
      const nq = nextQuestion()
      if (nq) {
        setChat((c) => [...c, { role: "system", text: `Next: ${nq.label}` }])
      } else {
        setChat((c) => [
          ...c,
          {
            role: "system",
            text: "All set. Switch to the Preview tab to see the VSM diagram. You can still refine values.",
          },
        ])
      }

      setInputValue("")
      return
    }

    // Otherwise treat as general instruction or re-parse commands
    setChat((c) => [
      ...c,
      { role: "system", text: "I captured your note. Use the Data tab to edit any fields directly, or upload a file." },
    ])
    setInputValue("")
  }

  // ------- File uploads -------

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return

    for (const f of Array.from(files)) {
      if (f.type.includes("csv") || f.name.toLowerCase().endsWith(".csv")) {
        const txt = await f.text()
        const { headers, rows } = parseCSV(txt)
        ingestTabular(headers, rows)
      } else if (f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".xls")) {
        try {
          // dynamic import to keep Step 1 lightweight
          // @ts-ignore
          const XLSX = await import("xlsx")
          const data = await f.arrayBuffer()
          const wb = XLSX.read(data, { type: "array" })
          const sheet = wb.Sheets[wb.SheetNames[0]]
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
          const headers = (json[0] || []).map((x: any) => String(x))
          const rows = json.slice(1) as string[][]
          ingestTabular(headers, rows)
        } catch (e) {
          setChat((c) => [...c, { role: "system", text: "Couldn't parse Excel. Please save as CSV for now." }])
        }
      } else if (f.type.startsWith("image/")) {
        // For Step 1, store a placeholder note.
        setChat((c) => [...c, { role: "system", text: `Image '${f.name}' received. OCR will be added in Step 3.` }])
      } else if (f.type.includes("text")) {
        const txt = await f.text()
        setInputValue((prev) => prev + "\n" + txt)
      } else {
        setChat((c) => [...c, { role: "system", text: `Unsupported file type: ${f.name}` }])
      }
    }
  }

  function ingestTabular(headers: string[], rows: string[][]) {
    // Heuristics: try to detect columns for foundry VSM
    const nameIdx = headers.findIndex((h) => /process|step|operation/i.test(h))
    const ctIdx = headers.findIndex((h) => /cycle/i.test(h))
    const coIdx = headers.findIndex((h) => /change.?over|setup/i.test(h))
    const upIdx = headers.findIndex((h) => /uptime|availability|util/i.test(h))
    const wipIdx = headers.findIndex((h) => /wip|inventory/i.test(h))
    const demandIdx = headers.findIndex((h) => /demand|takt|customer/i.test(h))

    const procs: VSMProcess[] = []
    rows.forEach((r, i) => {
      const name = (nameIdx >= 0 ? r[nameIdx] : `P${i + 1}`) ?? `P${i + 1}`
      procs.push({
        id: `P${i + 1}`,
        name: String(name),
        cycleTimeSec: ctIdx >= 0 && r[ctIdx] ? Number(r[ctIdx]) : undefined,
        changeoverSec: coIdx >= 0 && r[coIdx] ? Number(r[coIdx]) : undefined,
        uptimePct: upIdx >= 0 && r[upIdx] ? Number(r[upIdx]) : undefined,
        wipUnits: wipIdx >= 0 && r[wipIdx] ? Number(r[wipIdx]) : undefined,
      })
    })

    const ds: VSMDataset = {
      customerDemandPerDay:
        demandIdx >= 0 && rows[0]?.[demandIdx] ? Number(rows[0][demandIdx]) : dataset.customerDemandPerDay,
      processes: procs.length ? procs : dataset.processes,
    }

    setDataset(ds)
    setChat((c) => [...c, { role: "system", text: `Parsed ${procs.length} rows from your table.` }])

    const nq = nextQuestion()
    if (nq) setChat((c) => [...c, { role: "system", text: `Next: ${nq.label}` }])
  }

  // ------- Data editor -------

  function updateProcess(i: number, patch: Partial<VSMProcess>) {
    const ps = [...dataset.processes]
    ps[i] = { ...ps[i], ...patch }
    setDataset({ ...dataset, processes: ps })
  }

  // ------- Export -------

  function exportSVG() {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const src = serializer.serializeToString(svgRef.current)
    const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" })
    download("vsm.svg", blob)
  }

  async function exportPNG() {
    if (!svgRef.current) return
    const svgEl = svgRef.current
    const serializer = new XMLSerializer()
    const src = serializer.serializeToString(svgEl)
    const svg64 = btoa(unescape(encodeURIComponent(src)))
    const img = new Image()
    const w = svgEl.viewBox.baseVal.width || svgEl.clientWidth || 1200
    const h = svgEl.viewBox.baseVal.height || svgEl.clientHeight || 420
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => blob && download("vsm.png", blob))
    }
    img.src = `data:image/svg+xml;base64,${svg64}`
  }

  function exportTableCSV() {
    const headers = ["Step", "CycleTimeSec", "ChangeoverSec", "UptimePct", "WIPUnits"]
    const rows = dataset.processes.map((p) => [
      p.name,
      p.cycleTimeSec ?? "",
      p.changeoverSec ?? "",
      p.uptimePct ?? "",
      p.wipUnits ?? "",
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    downloadText("vsm_table.csv", csv)
  }

  // ------- Login modal -------

  function submitLogin(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const emailInput = String(formData.get("email") || "").trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailInput)) return alert("Enter a valid email")
    if (rememberMe) {
      localStorage.setItem("vsm_email", emailInput)
    }
    setEmail(emailInput)
    setShowLogin(false)
  }

  // ------- Renderers -------

  function VSMPreview() {
    const width = 1200,
      height = 420

    return (
      <div className="w-full overflow-auto border rounded-2xl bg-white p-4 shadow-sm">
        <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Title & Takt */}
          <text x={20} y={30} fontSize={18} fontWeight="bold">
            Foundry VSM
          </text>
          {typeof taktSec === "number" && (
            <text x={20} y={55} fontSize={14}>
              Takt ≈ {taktSec} sec/unit (assumes 8h/day)
            </text>
          )}

          {/* Edges */}
          {edges.map((e, idx) => (
            <g key={`e-${idx}`}>
              <line
                x1={e.points[0].x}
                y1={e.points[0].y}
                x2={e.points[1].x}
                y2={e.points[1].y}
                stroke="#1f2937"
                strokeWidth={2}
                markerEnd="url(#arrow)"
              />
              {/* WIP label mid-edge */}
              <text
                x={(e.points[0].x + e.points[1].x) / 2}
                y={(e.points[0].y + e.points[1].y) / 2 - 10}
                textAnchor="middle"
                fontSize={12}
              >
                {e.wip} WIP
              </text>
            </g>
          ))}

          <defs>
            <marker
              id="arrow"
              markerWidth="10"
              markerHeight="10"
              refX="10"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#1f2937" />
            </marker>
          </defs>

          {/* Nodes */}
          {nodes.map((n) => (
            <g key={n.id}>
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={12}
                ry={12}
                fill="#f3f4f6"
                stroke="#111827"
                strokeWidth={2}
              />
              <text x={n.x + n.w / 2} y={n.y + 22} textAnchor="middle" fontSize={14} fontWeight="bold">
                {n.name}
              </text>
              <text x={n.x + 8} y={n.y + 42} fontSize={12}>
                C/T: {n.data.cycleTimeSec ?? "-"}s
              </text>
              <text x={n.x + 8} y={n.y + 58} fontSize={12}>
                C/O: {n.data.changeoverSec ?? "-"}s
              </text>
              <text x={n.x + 8} y={n.y + 74} fontSize={12}>
                Uptime: {n.data.uptimePct ?? "-"}%
              </text>
            </g>
          ))}

          {/* Timeline */}
          <line x1={20} y1={height - 40} x2={width - 20} y2={height - 40} stroke="#6b7280" strokeDasharray="4 4" />
          <text x={20} y={height - 50} fontSize={12}>
            Material Flow Timeline
          </text>
        </svg>
      </div>
    )
  }

  const nextQ = nextQuestion()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gray-900" />
            <div>
              <div className="text-lg font-semibold">Foundry VSM Dashboard</div>
              <div className="text-xs text-gray-500">Step 1: Active UI • Deterministic Graph • Local save</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{email ?? "Not signed in"}</span>
            <button
              onClick={() => setShowLogin(true)}
              className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
            >
              {email ? "Switch account" : "Sign in"}
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chat & Upload */}
        <section className="lg:col-span-2 flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            {(["chat", "data", "preview"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={classNames(
                  "px-3 py-2 rounded-xl text-sm border",
                  activeTab === t ? "bg-gray-900 text-white" : "bg-white",
                )}
              >
                {t === "chat" ? "Chat" : t === "data" ? "Data" : "Preview"}
              </button>
            ))}
          </div>

          {/* Panels */}
          {activeTab === "chat" && (
            <div className="border rounded-2xl bg-white p-4 shadow-sm flex flex-col h-[520px]">
              <div className="flex-1 overflow-auto space-y-3 pr-1">
                {chat.map((m, i) => (
                  <div key={i} className={classNames("max-w-[85%]", m.role === "user" ? "ml-auto" : "")}>
                    <div
                      className={classNames(
                        "px-3 py-2 rounded-2xl text-sm",
                        m.role === "user" ? "bg-gray-900 text-white rounded-tr" : "bg-gray-100 rounded-tl",
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 mt-3">
                {nextQ && <div className="mb-2 text-xs text-gray-600">Next: {nextQ.label}</div>}
                <div className="flex items-center gap-2">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your answer or instruction..."
                    className="flex-1 px-3 py-2 border rounded-xl"
                  />
                  <button
                    onClick={() => handleUserMessage(inputValue)}
                    className="px-3 py-2 bg-gray-900 text-white rounded-xl"
                  >
                    Send
                  </button>
                  <label className="px-3 py-2 border rounded-xl cursor-pointer text-sm">
                    Upload
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                      accept=".csv,.xlsx,.xls,image/*,text/plain"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="border rounded-2xl bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-600">Customer demand (units/day)</label>
                  <input
                    type="number"
                    value={dataset.customerDemandPerDay ?? ""}
                    onChange={(e) => setDataset({ ...dataset, customerDemandPerDay: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">Processes</div>
                  <button
                    onClick={() =>
                      setDataset({
                        ...dataset,
                        processes: [
                          ...dataset.processes,
                          { id: `P${dataset.processes.length + 1}`, name: `Process ${dataset.processes.length + 1}` },
                        ],
                      })
                    }
                    className="px-3 py-1.5 border rounded-xl text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="p-2">#</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">C/T (s)</th>
                        <th className="p-2">C/O (s)</th>
                        <th className="p-2">Uptime (%)</th>
                        <th className="p-2">WIP (units)</th>
                        <th className="p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {dataset.processes.map((p, i) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-2">{i + 1}</td>
                          <td className="p-2">
                            <input
                              value={p.name}
                              onChange={(e) => updateProcess(i, { name: e.target.value })}
                              className="w-48 px-2 py-1 border rounded-lg"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={p.cycleTimeSec ?? ""}
                              onChange={(e) => updateProcess(i, { cycleTimeSec: Number(e.target.value) })}
                              className="w-28 px-2 py-1 border rounded-lg"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={p.changeoverSec ?? ""}
                              onChange={(e) => updateProcess(i, { changeoverSec: Number(e.target.value) })}
                              className="w-28 px-2 py-1 border rounded-lg"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={p.uptimePct ?? ""}
                              onChange={(e) => updateProcess(i, { uptimePct: Number(e.target.value) })}
                              className="w-28 px-2 py-1 border rounded-lg"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={p.wipUnits ?? ""}
                              onChange={(e) => updateProcess(i, { wipUnits: Number(e.target.value) })}
                              className="w-28 px-2 py-1 border rounded-lg"
                            />
                          </td>
                          <td className="p-2">
                            <button
                              onClick={() =>
                                setDataset({ ...dataset, processes: dataset.processes.filter((_, j) => j !== i) })
                              }
                              className="px-2 py-1 border rounded-lg"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button onClick={exportTableCSV} className="px-3 py-2 border rounded-xl">
                  Export Table CSV
                </button>
                <button onClick={() => setActiveTab("preview")} className="px-3 py-2 bg-gray-900 text-white rounded-xl">
                  Go to Preview
                </button>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-3">
              <VSMPreview />
              <div className="flex items-center gap-2">
                <button onClick={exportSVG} className="px-3 py-2 border rounded-xl">
                  Export SVG
                </button>
                <button onClick={exportPNG} className="px-3 py-2 border rounded-xl">
                  Export PNG
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right: Quick Start & Notes */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="border rounded-2xl bg-white p-4 shadow-sm">
            <div className="font-semibold mb-2">Quick start</div>
            <ol className="list-decimal ml-5 text-sm space-y-1">
              <li>Open the Chat tab and answer the prompts, or upload CSV/Excel.</li>
              <li>Fill any missing values in the Data tab.</li>
              <li>Open Preview to see the deterministic VSM.</li>
              <li>Use Export to download the VSM (SVG/PNG) and table (CSV).</li>
            </ol>
          </div>

          <div className="border rounded-2xl bg-white p-4 shadow-sm text-sm">
            <div className="font-semibold mb-2">Determinism</div>
            <p>
              The diagram layout is computed from a stable hash of your inputs. The same inputs will always produce the
              same diagram. Tiny jitters are disabled to guarantee exact repeatability in Step 1.
            </p>
          </div>
        </aside>
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Background */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #e8b4bc 0%, #d4a5b8 25%, #b8a5c8 50%, #8fa5d8 75%, #6b8fd8 100%)",
              }}
            />
          </div>

          {/* Card */}
          <div className="relative mx-4 w-full max-w-md">
            {/* User avatar circle at top */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-10">
              <div className="w-32 h-32 rounded-full bg-[#1a3a52] flex items-center justify-center shadow-xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            {/* Main card */}
            <div
              className="rounded-3xl p-8 pt-20 shadow-2xl backdrop-blur-sm"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
              }}
            >
              {/* Email input with icon */}
              <div className="mb-4">
                <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                  <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="Email ID"
                    className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                  />
                </div>
              </div>

              {/* Password input with icon */}
              <div className="mb-4">
                <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                  <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                  />
                </div>
              </div>

              {/* Remember me and Forgot Password */}
              <div className="flex items-center justify-between mb-6 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-[#1a3a52]"
                  />
                  <span className="text-gray-700">Remember me</span>
                </label>
                <button type="button" className="text-[#5a7a92] hover:text-[#1a3a52] italic">
                  Forgot Password?
                </button>
              </div>

              {/* Login button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  // For now, just close the modal - in production this would validate
                  const testEmail = "user@example.com"
                  localStorage.setItem("vsm_email", testEmail)
                  setEmail(testEmail)
                  setShowLogin(false)
                }}
                className="w-full py-3 rounded-full text-white font-semibold text-lg tracking-wider shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
                  color: "#1a3a52",
                }}
              >
                LOGIN
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t mt-8">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-gray-500">
          © {new Date().getFullYear()} VSM Dashboard (Step 1). Local prototype. No server yet.
        </div>
      </footer>
    </div>
  )
}
