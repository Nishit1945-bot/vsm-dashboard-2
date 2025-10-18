"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { VSMGraph } from "@/components/vsm-graph"
import { useRouter } from "next/navigation"
import Image from "next/image"

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

// CSV parser (light). For production, consider PapaParse.
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

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<{ full_name?: string } | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [isCreateAccount, setIsCreateAccount] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [chat, setChat] = useState<Array<{ role: "system" | "user"; text: string }>>([])
  const [dataset, setDataset] = useState<VSMDataset>({ processes: [] })
  const [activeTab, setActiveTab] = useState<"chat" | "data" | "preview">("chat")
  const svgRef = useRef<SVGSVGElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentProjectName, setCurrentProjectName] = useState<string>("")
  const [useSupabase, setUseSupabase] = useState(false)
  const [previousChats, setPreviousChats] = useState<
    Array<{ id: string; title: string; project_name?: string; updated_at: string }>
  >([])
  const [showPreviousChats, setShowPreviousChats] = useState(false)
  const [conversationState, setConversationState] = useState<"greeting" | "asking_project" | "collecting_data">(
    "greeting",
  )

  const supabase = getSupabaseBrowserClient()
  const router = useRouter()

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chat])

  useEffect(() => {
    async function loadUserAndData() {
      try {
        const supabaseConfigured = isSupabaseConfigured()
        setUseSupabase(supabaseConfigured)

        if (!supabaseConfigured) {
          console.log("[v0] Supabase not configured, using localStorage mode")
          const savedChat = localStorage.getItem("vsm_chat")
          const savedDataset = localStorage.getItem("vsm_dataset")

          if (savedChat) {
            try {
              setChat(JSON.parse(savedChat))
            } catch (e) {
              console.error("[v0] Error parsing saved chat:", e)
            }
          }

          if (savedDataset) {
            try {
              setDataset(JSON.parse(savedDataset))
            } catch (e) {
              console.error("[v0] Error parsing saved dataset:", e)
            }
          }

          setLoading(false)
          return
        }

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (!currentUser) {
          setShowLogin(true)
          setLoading(false)
          return
        }

        setUser(currentUser)

        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("id", currentUser.id)
          .single()

        if (profileError) {
          console.error("[v0] Error loading profile:", profileError)
        }

        if (profile && profile.full_name) {
          setUserProfile(profile)
        } else {
          // If no profile exists, try to get full_name from user metadata
          const fullNameFromMeta = currentUser.user_metadata?.full_name
          if (fullNameFromMeta) {
            setUserProfile({ full_name: fullNameFromMeta })
          }
        }

        const { data: allChats } = await supabase
          .from("chats")
          .select("id, title, project_name, updated_at")
          .eq("user_id", currentUser.id)
          .order("updated_at", { ascending: false })

        if (allChats) {
          setPreviousChats(allChats)
        }

        const { data: chats } = await supabase
          .from("chats")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("updated_at", { ascending: false })
          .limit(1)

        let chatId: string

        if (chats && chats.length > 0) {
          chatId = chats[0].id
          setCurrentChatId(chatId)
          setCurrentProjectName(chats[0].project_name || "")

          const { data: messages } = await supabase
            .from("messages")
            .select("*")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: true })

          if (messages && messages.length > 0) {
            setChat(messages.map((m) => ({ role: m.role as "system" | "user", text: m.content })))
            setConversationState("collecting_data")
          }

          const { data: datasets } = await supabase
            .from("vsm_datasets")
            .select("*")
            .eq("chat_id", chatId)
            .order("updated_at", { ascending: false })
            .limit(1)

          if (datasets && datasets.length > 0) {
            setDataset({
              customerDemandPerDay: datasets[0].customer_demand_per_day,
              processes: datasets[0].processes,
            })
          }
        } else {
          const { data: newChat } = await supabase
            .from("chats")
            .insert({ user_id: currentUser.id, title: "New VSM Chat", project_name: "" })
            .select()
            .single()

          if (newChat) {
            chatId = newChat.id
            setCurrentChatId(chatId)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading user data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndData()

    if (isSupabaseConfigured()) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        if (!session?.user) {
          setShowLogin(true)
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!useSupabase && chat.length > 0) {
      localStorage.setItem("vsm_chat", JSON.stringify(chat))
    }
  }, [chat, useSupabase])

  useEffect(() => {
    if (!useSupabase && dataset.processes.length > 0) {
      localStorage.setItem("vsm_dataset", JSON.stringify(dataset))
    }
  }, [dataset, useSupabase])

  useEffect(() => {
    async function saveMessages() {
      if (!useSupabase || !user || !currentChatId || chat.length === 0) return

      try {
        const { data: existingMessages } = await supabase.from("messages").select("id").eq("chat_id", currentChatId)

        const existingCount = existingMessages?.length ?? 0

        if (chat.length > existingCount) {
          const newMessages = chat.slice(existingCount).map((m) => ({
            chat_id: currentChatId,
            role: m.role,
            content: m.text,
          }))

          await supabase.from("messages").insert(newMessages)
        }

        await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", currentChatId)
      } catch (error) {
        console.error("[v0] Error saving messages:", error)
      }
    }

    saveMessages()
  }, [chat, user, currentChatId, supabase, useSupabase])

  useEffect(() => {
    async function saveDataset() {
      if (!useSupabase || !user || !currentChatId || dataset.processes.length === 0) return

      try {
        const { data: existing } = await supabase
          .from("vsm_datasets")
          .select("id")
          .eq("chat_id", currentChatId)
          .single()

        const dataToSave = {
          chat_id: currentChatId,
          user_id: user.id,
          customer_demand_per_day: dataset.customerDemandPerDay,
          processes: dataset.processes,
          updated_at: new Date().toISOString(),
        }

        if (existing) {
          await supabase.from("vsm_datasets").update(dataToSave).eq("id", existing.id)
        } else {
          await supabase.from("vsm_datasets").insert(dataToSave)
        }
      } catch (error) {
        console.error("[v0] Error saving dataset:", error)
      }
    }

    saveDataset()
  }, [dataset, user, currentChatId, supabase, useSupabase])

  useEffect(() => {
    if (chat.length === 0 && !loading) {
      setChat([
        {
          role: "system",
          text: "What's the project today?",
        },
      ])
      setConversationState("asking_project")
    }
  }, [chat.length, loading])

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

  async function handleUserMessage(raw: string) {
    const text = raw.trim()
    if (!text) return

    setChat((c) => [...c, { role: "user", text }])

    if (conversationState === "greeting" || conversationState === "asking_project") {
      const lowerText = text.toLowerCase()

      // Check if it's a greeting
      if (lowerText.match(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)/)) {
        setChat((c) => [...c, { role: "system", text: "Hello! What's the project today?" }])
        setConversationState("asking_project")
        setInputValue("")
        return
      }

      // Assume the response is the project name
      setCurrentProjectName(text)

      // Update chat title and project name in database
      if (useSupabase && currentChatId) {
        await supabase.from("chats").update({ title: text, project_name: text }).eq("id", currentChatId)
      }

      setChat((c) => [
        ...c,
        {
          role: "system",
          text: `Great! Let's create a Value Stream Mapping for "${text}". I'll need some information to generate the diagram. You can provide details naturally, and I'll fill in the form on the right as we go.`,
        },
        {
          role: "system",
          text: "Let's start with: What is the customer demand per day (in units)?",
        },
      ])
      setConversationState("collecting_data")
      setInputValue("")
      return
    }

    const q = nextQuestion()
    if (q) {
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

      const nq = nextQuestion()
      if (nq) {
        setChat((c) => [...c, { role: "system", text: `Next: ${nq.label}` }])
      } else {
        setChat((c) => [
          ...c,
          {
            role: "system",
            text: "All set! Switch to the Preview tab to see your VSM diagram. You can still refine values in the Data tab.",
          },
        ])
      }

      setInputValue("")
      return
    }

    setChat((c) => [
      ...c,
      { role: "system", text: "I captured your note. Use the Data tab to edit any fields directly, or upload a file." },
    ])
    setInputValue("")
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return

    for (const f of Array.from(files)) {
      if (f.type.includes("csv") || f.name.toLowerCase().endsWith(".csv")) {
        const txt = await f.text()
        const { headers, rows } = parseCSV(txt)
        ingestTabular(headers, rows)
      } else if (f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".xls")) {
        try {
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

  function updateProcess(i: number, patch: Partial<VSMProcess>) {
    const ps = [...dataset.processes]
    ps[i] = { ...ps[i], ...patch }
    setDataset({ ...dataset, processes: ps })
  }

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
    const h = svgEl.viewBox.baseVal.height || svgEl.clientHeight || 600
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

  async function handleNewChat() {
    // Clear current state
    setChat([])
    setDataset({ processes: [] })
    setCurrentProjectName("")
    setConversationState("asking_project")

    if (!useSupabase || !user) {
      localStorage.removeItem("vsm_chat")
      localStorage.removeItem("vsm_dataset")
      setCurrentChatId(null)

      // Set initial message immediately
      setChat([{ role: "system", text: "What's the project today?" }])
      return
    }

    try {
      // Create new chat directly with client-side Supabase
      const { data: newChat, error } = await supabase
        .from("chats")
        .insert({
          user_id: user.id,
          title: "New VSM Chat",
          project_name: "",
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating new chat:", error)
        alert(`Failed to create new chat: ${error.message}`)
        return
      }

      if (newChat) {
        setCurrentChatId(newChat.id)

        // Set initial message immediately
        setChat([{ role: "system", text: "What's the project today?" }])

        // Refresh previous chats list
        const { data: allChats } = await supabase
          .from("chats")
          .select("id, title, project_name, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })

        if (allChats) {
          setPreviousChats(allChats)
        }
      }
    } catch (error: any) {
      console.error("[v0] Error creating new chat:", error)
      alert(`Failed to create new chat: ${error.message}`)
    }
  }

  async function loadPreviousChat(chatId: string) {
    if (!useSupabase || !user) return

    try {
      setCurrentChatId(chatId)

      // Get chat details including project name
      const { data: chatData } = await supabase.from("chats").select("project_name").eq("id", chatId).single()

      if (chatData) {
        setCurrentProjectName(chatData.project_name || "")
      }

      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })

      if (messages && messages.length > 0) {
        setChat(messages.map((m) => ({ role: m.role as "system" | "user", text: m.content })))
        setConversationState("collecting_data")
      } else {
        setChat([])
        setConversationState("greeting")
      }

      const { data: datasets } = await supabase
        .from("vsm_datasets")
        .select("*")
        .eq("chat_id", chatId)
        .order("updated_at", { ascending: false })
        .limit(1)

      if (datasets && datasets.length > 0) {
        setDataset({
          customerDemandPerDay: datasets[0].customer_demand_per_day,
          processes: datasets[0].processes,
        })
      } else {
        setDataset({ processes: [] })
      }

      setShowPreviousChats(false)
    } catch (error) {
      console.error("[v0] Error loading previous chat:", error)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()

    if (!useSupabase) return

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const emailInput = String(formData.get("resetEmail") || "").trim()

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailInput)) {
      alert("Enter a valid email")
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        alert(`Error: ${error.message}`)
        return
      }

      alert("Password reset link sent to your email!")
      setShowForgotPassword(false)
    } catch (error: any) {
      console.error("[v0] Password reset error:", error)
      alert(`Error: ${error.message}`)
    }
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault()

    if (!useSupabase) {
      setShowLogin(false)
      return
    }

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const emailInput = String(formData.get("email") || "").trim()
    const passwordInput = String(formData.get("password") || "").trim()
    const fullNameInput = String(formData.get("fullName") || "").trim()
    const confirmPasswordInput = String(formData.get("confirmPassword") || "").trim()
    const phoneInput = String(formData.get("phone") || "").trim()
    const companyInput = String(formData.get("company") || "").trim()

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailInput)) {
      alert("Enter a valid email")
      return
    }

    if (!passwordInput || passwordInput.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }

    if (isCreateAccount) {
      if (!fullNameInput) {
        alert("Please enter your full name")
        return
      }

      if (passwordInput !== confirmPasswordInput) {
        alert("Passwords do not match")
        return
      }
    }

    try {
      setLoading(true)

      if (isCreateAccount) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: emailInput,
          password: passwordInput,
          options: {
            data: {
              full_name: fullNameInput,
              phone: phoneInput,
              company: companyInput,
            },
          },
        })

        if (signUpError) {
          alert(`Error: ${signUpError.message}`)
          return
        }

        if (signUpData.user) {
          await supabase.from("user_profiles").insert({
            id: signUpData.user.id,
            email: emailInput,
            full_name: fullNameInput,
            phone: phoneInput,
            company: companyInput,
          })

          // Automatically sign in after account creation
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: emailInput,
            password: passwordInput,
          })

          if (signInError) {
            alert(`Account created but sign in failed: ${signInError.message}`)
            return
          }

          alert("Account created successfully!")
          setShowLogin(false)
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput,
        })

        if (signInError) {
          alert(`Error: ${signInError.message}`)
          return
        }

        setShowLogin(false)
      }
    } catch (error: any) {
      console.error("[v0] Auth error:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    if (useSupabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setChat([])
    setDataset({ processes: [] })
    setCurrentChatId(null)
    setCurrentProjectName("")
    setConversationState("greeting")
    localStorage.removeItem("vsm_chat")
    localStorage.removeItem("vsm_dataset")
    if (useSupabase) {
      setShowLogin(true)
    }
  }

  const nextQ = nextQuestion()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Lean Vision Logo" width={56} height={56} className="rounded-xl" />
            <div>
              <div className="text-lg font-semibold">Lean Vision-VSM</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && useSupabase && (
              <>
                <button
                  onClick={handleNewChat}
                  className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Chat
                </button>
                <button
                  onClick={() => setShowPreviousChats(!showPreviousChats)}
                  className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Previous Chats
                </button>
              </>
            )}
            <span className="text-sm font-medium text-gray-700">
              {useSupabase
                ? user
                  ? userProfile?.full_name || user.email?.split("@")[0] || "User"
                  : "Not signed in"
                : "Local mode"}
            </span>
            {useSupabase && (
              <>
                {user ? (
                  <button onClick={handleSignOut} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
                    Sign out
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                  >
                    Sign in
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {showPreviousChats && user && useSupabase && (
        <div className="fixed top-16 right-4 z-20 w-80 bg-white border rounded-xl shadow-lg max-h-96 overflow-auto">
          <div className="p-4 border-b font-semibold">Previous Chats</div>
          <div className="divide-y">
            {previousChats.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No previous chats</div>
            ) : (
              previousChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => loadPreviousChat(chat.id)}
                  className={classNames(
                    "w-full text-left p-4 hover:bg-gray-50 transition-colors",
                    currentChatId === chat.id ? "bg-gray-100" : "",
                  )}
                >
                  <div className="font-medium text-sm">{chat.project_name || chat.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(chat.updated_at).toLocaleString()}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 flex flex-col gap-4">
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

          {activeTab === "chat" && (
            <div className="border rounded-2xl bg-white p-4 shadow-sm flex flex-col h-[520px]">
              <div ref={chatContainerRef} className="flex-1 overflow-auto space-y-3 pr-1">
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
                    onKeyDown={(e) => e.key === "Enter" && handleUserMessage(inputValue)}
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
                    value={
                      dataset.customerDemandPerDay !== undefined && dataset.customerDemandPerDay !== null
                        ? dataset.customerDemandPerDay
                        : ""
                    }
                    onChange={(e) =>
                      setDataset({ ...dataset, customerDemandPerDay: Number(e.target.value) || undefined })
                    }
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
                              value={p.cycleTimeSec !== undefined && p.cycleTimeSec !== null ? p.cycleTimeSec : ""}
                              onChange={(e) => updateProcess(i, { cycleTimeSec: Number(e.target.value) || undefined })}
                              className="w-28 px-2 py-1 border rounded-lg"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={p.changeoverSec !== undefined && p.changeoverSec !== null ? p.changeoverSec : ""}
                              onChange={(e) => updateProcess(i, { changeoverSec: Number(e.target.value) || undefined })}
                              className="w-28 px-2 py-1 border rounded-lg"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={p.uptimePct !== undefined && p.uptimePct !== null ? p.uptimePct : ""}
                              onChange={(e) => updateProcess(i, { uptimePct: Number(e.target.value) || undefined })}
                              className="w-28 px-2 py-1 border rounded-lg"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={p.wipUnits !== undefined && p.wipUnits !== null ? p.wipUnits : ""}
                              onChange={(e) => updateProcess(i, { wipUnits: Number(e.target.value) || undefined })}
                              className="w-28 px-2 py-1 border rounded-lg"
                            />
                          </td>
                          <td className="p-2">
                            <button
                              onClick={() =>
                                setDataset({ ...dataset, processes: dataset.processes.filter((_, j) => j !== i) })
                              }
                              className="px-2 py-1 border rounded-lg text-xs"
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
                <button onClick={exportTableCSV} className="px-3 py-2 border rounded-xl text-sm">
                  Export Table CSV
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className="px-3 py-2 bg-gray-900 text-white rounded-xl text-sm"
                >
                  Go to Preview
                </button>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-3">
              <div className="border rounded-2xl bg-white p-4 shadow-sm overflow-auto">
                <VSMGraph ref={svgRef} dataset={dataset} width={1200} height={600} />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportSVG} className="px-3 py-2 border rounded-xl text-sm">
                  Export SVG
                </button>
                <button onClick={exportPNG} className="px-3 py-2 border rounded-xl text-sm">
                  Export PNG
                </button>
                <button onClick={exportTableCSV} className="px-3 py-2 border rounded-xl text-sm">
                  Export CSV
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="lg:col-span-1 space-y-4">
          <div className="border rounded-2xl bg-white p-4 shadow-sm">
            <div className="font-semibold mb-3">Project Information</div>
            {currentProjectName && (
              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Project Name</div>
                <div className="font-medium">{currentProjectName}</div>
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div
                className={classNames("p-2 rounded-lg", dataset.customerDemandPerDay ? "bg-green-50" : "bg-gray-50")}
              >
                <div className="text-xs text-gray-600">Customer Demand</div>
                <div className="font-medium">
                  {dataset.customerDemandPerDay ? `${dataset.customerDemandPerDay} units/day` : "Not provided"}
                </div>
              </div>
              <div
                className={classNames("p-2 rounded-lg", dataset.processes.length > 0 ? "bg-green-50" : "bg-gray-50")}
              >
                <div className="text-xs text-gray-600">Process Steps</div>
                <div className="font-medium">
                  {dataset.processes.length > 0 ? `${dataset.processes.length} steps` : "Not provided"}
                </div>
              </div>
              <div
                className={classNames(
                  "p-2 rounded-lg",
                  dataset.processes.some((p) => p.cycleTimeSec != null) ? "bg-green-50" : "bg-gray-50",
                )}
              >
                <div className="text-xs text-gray-600">Cycle Times</div>
                <div className="font-medium">
                  {dataset.processes.some((p) => p.cycleTimeSec != null) ? "Provided" : "Not provided"}
                </div>
              </div>
              <div
                className={classNames(
                  "p-2 rounded-lg",
                  dataset.processes.some((p) => p.changeoverSec != null) ? "bg-green-50" : "bg-gray-50",
                )}
              >
                <div className="text-xs text-gray-600">Changeover Times</div>
                <div className="font-medium">
                  {dataset.processes.some((p) => p.changeoverSec != null) ? "Provided" : "Not provided"}
                </div>
              </div>
              <div
                className={classNames(
                  "p-2 rounded-lg",
                  dataset.processes.some((p) => p.uptimePct != null) ? "bg-green-50" : "bg-gray-50",
                )}
              >
                <div className="text-xs text-gray-600">Uptime %</div>
                <div className="font-medium">
                  {dataset.processes.some((p) => p.uptimePct != null) ? "Provided" : "Not provided"}
                </div>
              </div>
              <div
                className={classNames(
                  "p-2 rounded-lg",
                  dataset.processes.some((p) => p.wipUnits != null) ? "bg-green-50" : "bg-gray-50",
                )}
              >
                <div className="text-xs text-gray-600">WIP Values</div>
                <div className="font-medium">
                  {dataset.processes.some((p) => p.wipUnits != null) ? "Provided" : "Not provided"}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {showLogin && !showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #e8b4bc 0%, #d4a5b8 25%, #b8a5c8 50%, #8fa5d8 75%, #6b8fd8 100%)",
              }}
            />
          </div>

          <div className="relative w-full max-w-md flex flex-col items-center">
            {/* Welcome text at the top */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Welcome to Lean Vision</h1>
              <p className="text-lg text-white/90 drop-shadow">The Gen-AI-VSM</p>
            </div>

            {/* Logo circle in the middle */}
            <div className="mb-8">
              <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl border-4 border-white/30">
                <Image src="/logo.png" alt="Lean Vision Logo" width={80} height={80} className="drop-shadow-lg" />
              </div>
            </div>

            {/* Form card at the bottom */}
            <form onSubmit={submitLogin} className="w-full">
              <div
                className="rounded-3xl p-8 shadow-2xl backdrop-blur-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.85)",
                }}
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateAccount(false)}
                    className={classNames(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      !isCreateAccount ? "bg-[#1a3a52] text-white" : "bg-gray-200 text-gray-700",
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateAccount(true)}
                    className={classNames(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isCreateAccount ? "bg-[#1a3a52] text-white" : "bg-gray-200 text-gray-700",
                    )}
                  >
                    Create Account
                  </button>
                </div>

                {isCreateAccount && (
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
                        name="fullName"
                        type="text"
                        placeholder="Full Name"
                        required={isCreateAccount}
                        className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                    <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <input
                      name="email"
                      type="email"
                      placeholder="Email ID"
                      required
                      className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                    />
                  </div>
                </div>

                {isCreateAccount && (
                  <div className="mb-4">
                    <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                      <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <input
                        name="phone"
                        type="tel"
                        placeholder="Phone Number (Optional)"
                        className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                      />
                    </div>
                  </div>
                )}

                {isCreateAccount && (
                  <div className="mb-4">
                    <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                      <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <input
                        name="company"
                        type="text"
                        placeholder="Company Name (Optional)"
                        className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                      />
                    </div>
                  </div>
                )}

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
                      name="password"
                      type="password"
                      placeholder="Password"
                      required
                      minLength={6}
                      className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                    />
                  </div>
                </div>

                {isCreateAccount && (
                  <div className="mb-4">
                    <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                      <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm Password"
                        required={isCreateAccount}
                        minLength={6}
                        className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                      />
                    </div>
                  </div>
                )}

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
                  {!isCreateAccount && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[#5a7a92] hover:text-[#1a3a52] italic"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full text-white font-semibold text-lg tracking-wider shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
                    color: "#1a3a52",
                  }}
                >
                  {loading ? "PLEASE WAIT..." : isCreateAccount ? "CREATE ACCOUNT" : "LOGIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #e8b4bc 0%, #d4a5b8 25%, #b8a5c8 50%, #8fa5d8 75%, #6b8fd8 100%)",
              }}
            />
          </div>

          <div className="relative mx-4 w-full max-w-md">
            <form onSubmit={handleForgotPassword}>
              <div
                className="rounded-3xl p-8 shadow-2xl backdrop-blur-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.85)",
                }}
              >
                <h2 className="text-2xl font-bold text-center mb-6 text-[#1a3a52]">Reset Password</h2>
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <div className="mb-6">
                  <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                    <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <input
                      name="resetEmail"
                      type="email"
                      placeholder="Email Address"
                      required
                      className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full text-white font-semibold text-lg tracking-wider shadow-lg hover:shadow-xl transition-all mb-4"
                  style={{
                    background: "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
                    color: "#1a3a52",
                  }}
                >
                  SEND RESET LINK
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-2 text-[#5a7a92] hover:text-[#1a3a52] text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t mt-8">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-gray-500">
          © {new Date().getFullYear()} VSM Dashboard. {useSupabase ? "Cloud-enabled" : "Local mode"} with AI assistance.
        </div>
      </footer>
    </div>
  )
}
