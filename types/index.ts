export interface Chat {
  id: string
  user_id: string
  title: string
  project_name?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface VSMProcess {
  id: string
  name: string
  cycleTimeSec?: number
  changeoverSec?: number
  uptimePct?: number
  wipUnits?: number
}

export interface VSMDataset {
  customerDemandPerDay?: number
  processes: VSMProcess[]
}