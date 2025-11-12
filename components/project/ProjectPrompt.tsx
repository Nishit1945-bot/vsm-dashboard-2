'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProjectPromptProps {
  onSubmit: (projectName: string) => void
}

export default function ProjectPrompt({ onSubmit }: ProjectPromptProps) {
  const [projectName, setProjectName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (projectName.trim()) {
      onSubmit(projectName.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Lean Vision Logo"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-xl"
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Lean Vision</h1>
          <p className="text-lg text-gray-600">The Gen-AI-VSM</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            What's the task today?
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter task name..."
              required
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-lg"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Start Task
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}