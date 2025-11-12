'use client'

import { useState } from 'react'
import ChatInterface from '@/components/chat/ChatInterface'
import VSMDataForm from '../vsm/VSMDataForm'
import type { Message } from '@/types'

interface VSMProcess {
  id: string
  name: string
  cycleTimeSec?: number
  changeoverSec?: number
  uptimePct?: number
  wipUnits?: number
}

interface DashboardProps {
  projectName: string
  chatId: string
  messages: Message[]
  isLoading: boolean
  onSendMessage: (message: string) => Promise<void>
}

export default function Dashboard({
  projectName,
  chatId,
  messages,
  isLoading,
  onSendMessage,
}: DashboardProps) {
  // VSM Data State
  const [customerDemand, setCustomerDemand] = useState<number | undefined>()
  const [processes, setProcesses] = useState<VSMProcess[]>([])
  const [activeTab, setActiveTab] = useState<'chat' | 'data' | 'preview'>('chat')

  // VSM Data handlers
  function handleAddProcess() {
    const newProcess: VSMProcess = {
      id: `process-${Date.now()}`,
      name: `Process ${processes.length + 1}`,
    }
    setProcesses([...processes, newProcess])
  }

  function handleUpdateProcess(index: number, updates: Partial<VSMProcess>) {
    const updated = [...processes]
    updated[index] = { ...updated[index], ...updates }
    setProcesses(updated)
  }

  function handleRemoveProcess(index: number) {
    setProcesses(processes.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{projectName}</h1>
            <p className="text-sm text-gray-500">Value Stream Mapping</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'data'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Data
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Left: Chat */}
              <ChatInterface
                messages={messages}
                onSendMessage={onSendMessage}
                isLoading={isLoading}
              />

              {/* Right: VSM Data Form */}
              <VSMDataForm
                customerDemand={customerDemand}
                processes={processes}
                onCustomerDemandChange={setCustomerDemand}
                onAddProcess={handleAddProcess}
                onUpdateProcess={handleUpdateProcess}
                onRemoveProcess={handleRemoveProcess}
              />
            </div>
          )}

          {activeTab === 'data' && (
            <div className="h-full">
              <VSMDataForm
                customerDemand={customerDemand}
                processes={processes}
                onCustomerDemandChange={setCustomerDemand}
                onAddProcess={handleAddProcess}
                onUpdateProcess={handleUpdateProcess}
                onRemoveProcess={handleRemoveProcess}
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="h-full flex items-center justify-center bg-white rounded-2xl border">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg">VSM Preview Coming Soon</p>
                <p className="text-sm mt-2">Add process data to generate the diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}