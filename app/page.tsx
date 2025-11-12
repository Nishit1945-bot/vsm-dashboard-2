'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import LoginForm from '@/components/auth/LoginForm'
import Sidebar from '@/components/layout/Sidebar'
import ProjectPrompt from '@/components/project/ProjectPrompt'
import ChatInterface from '@/components/chat/ChatInterface'
import { useChat } from '@/lib/hooks/useChat'

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showProjectPrompt, setShowProjectPrompt] = useState(true)

  const {
    chats,
    currentChatId,
    messages,
    isLoading: isChatLoading,
    setCurrentChatId,
    handleNewChat,
    handleSendMessage,
  } = useChat(user?.id || null)

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      const supabaseConfigured = isSupabaseConfigured()
      
      if (!supabaseConfigured) {
        console.log('[App] Supabase not configured, using local mode')
        setLoading(false)
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        console.log('[App] Failed to create Supabase client')
        setLoading(false)
        return
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        setShowLogin(true)
      } else {
        setUser(currentUser)
      }
      
      setLoading(false)
    }

    loadUser()

    // Listen for auth changes
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient()
      if (supabase) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null)
          if (!session?.user) {
            setShowLogin(true)
          }
        })
        return () => subscription.unsubscribe()
      }
    }
  }, [])

  // Show project prompt when no active chat
  useEffect(() => {
    setShowProjectPrompt(!currentChatId)
  }, [currentChatId])

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setCurrentChatId(null)
    setShowLogin(true)
  }

  async function handleProjectSubmit(projectName: string) {
    await handleNewChat(projectName)
    setShowProjectPrompt(false)
  }

  function handleNewChatClick() {
    setCurrentChatId(null)
    setShowProjectPrompt(true)
  }

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

  if (showLogin) {
    return <LoginForm onSuccess={() => setShowLogin(false)} />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        user={user}
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChatClick}
        onSelectChat={setCurrentChatId}
        onSignOut={handleSignOut}
      />

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {showProjectPrompt ? (
          <ProjectPrompt onSubmit={handleProjectSubmit} />
        ) : (
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto h-full">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}