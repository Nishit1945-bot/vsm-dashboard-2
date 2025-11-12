'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Chat } from '@/types'

interface SidebarProps {
  user: any
  chats: Chat[]
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onSignOut: () => void
}

export default function Sidebar({
  user,
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onSignOut,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-20 ${
        isOpen ? 'w-64' : 'w-64 -translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="flex flex-col h-full">
        {/* Logo and brand */}
        <div className="p-4 border-b border-gray-700 flex items-center gap-3">
          <Image src="/logo.png" alt="Lean Vision Logo" width={40} height={40} className="rounded-lg" />
          <div className="flex-1">
            <div className="font-semibold text-sm">Lean Vision</div>
            <div className="text-xs text-gray-400">Gen-AI-VSM</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">New Chat</span>
          </button>

          <div className="border-t border-gray-700 my-4" />

          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm font-medium">Create New Project</span>
          </button>

          <div className="text-xs text-gray-400 px-3 mb-2 mt-4">Previous Chats</div>
          <div className="space-y-1">
            {chats.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No previous chats</div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentChatId === chat.id ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="truncate">{chat.project_name || chat.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {new Date(chat.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.email?.[0]?.toUpperCase() || 'L'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {user?.email?.split('@')[0] || 'Local mode'}
              </div>
              {user && <div className="text-xs text-gray-400 truncate">{user.email}</div>}
            </div>
          </div>
          {user && (
            <button
              onClick={onSignOut}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-800 transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}