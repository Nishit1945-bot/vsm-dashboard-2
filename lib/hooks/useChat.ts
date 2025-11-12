import { useState, useEffect } from 'react'
import type { Chat, Message } from '@/types'
import { getUserChats, getChatMessages, createNewChat, addMessage } from '@/lib/supabase/queries'

export function useChat(userId: string | null) {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load user's chats
  useEffect(() => {
    if (userId) {
      loadChats()
    }
  }, [userId])

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages()
    } else {
      setMessages([])
    }
  }, [currentChatId])

  async function loadChats() {
    if (!userId) return
    const userChats = await getUserChats(userId)
    setChats(userChats)
  }

  async function loadMessages() {
    if (!currentChatId) return
    const chatMessages = await getChatMessages(currentChatId)
    setMessages(chatMessages)
  }

  async function handleNewChat(projectName: string) {
    if (!userId) {
      // Local mode: create chat without Supabase
      const localChat: Chat = {
        id: `local-${Date.now()}`,
        user_id: 'local',
        title: projectName,
        project_name: projectName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setChats((prev) => [localChat, ...prev])
      setCurrentChatId(localChat.id)
      
      // Add initial system message
      const welcomeMsg: Message = {
        id: `msg-${Date.now()}`,
        chat_id: localChat.id,
        role: 'assistant',
        content: `Great! Let's create a Value Stream Mapping for "${projectName}". I'll help you collect the necessary data. What would you like to know about VSM?`,
        created_at: new Date().toISOString(),
      }
      setMessages([welcomeMsg])
      return
    }

    const newChat = await createNewChat(userId, projectName)
    if (newChat) {
      setChats((prev) => [newChat, ...prev])
      setCurrentChatId(newChat.id)
      
      // Add initial system message
      await addMessage(
        newChat.id,
        'assistant',
        `Great! Let's create a Value Stream Mapping for "${projectName}". I'll help you collect the necessary data. What would you like to know about VSM?`
      )
      await loadMessages()
    }
  }

  async function handleSendMessage(content: string) {
    if (!currentChatId) return

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      chat_id: currentChatId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    // Save to database if not in local mode
    if (userId) {
      const savedMessage = await addMessage(currentChatId, 'user', content)
      if (savedMessage) {
        // Replace temp message with saved one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempUserMessage.id ? savedMessage : msg
          )
        )
      }
    }

    // Get AI response
    setIsLoading(true)
    try {
      const response = await fetch('/api/hf-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
        }),
      })

      if (response.ok) {
        const { response: aiResponse } = await response.json()
        
        // Add AI response
        if (userId) {
          const aiMessage = await addMessage(currentChatId, 'assistant', aiResponse)
          if (aiMessage) {
            setMessages((prev) => [...prev, aiMessage])
          }
        } else {
          // Local mode
          const localAiMessage: Message = {
            id: `msg-${Date.now()}`,
            chat_id: currentChatId,
            role: 'assistant',
            content: aiResponse,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, localAiMessage])
        }
      } else {
        // Handle API errors
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || 'Failed to get AI response'
        
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          chat_id: currentChatId,
          role: 'assistant',
          content: `Sorry, ${errorMessage}. Please try again.`,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMsg])
      }
    } catch (error) {
      console.error('[Chat] Error getting AI response:', error)
      
      // Show error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        chat_id: currentChatId,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    chats,
    currentChatId,
    messages,
    isLoading,
    setCurrentChatId,
    handleNewChat,
    handleSendMessage,
    loadChats,
  }
}