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
    if (!userId) return

    const newChat = await createNewChat(userId, projectName)
    if (newChat) {
      setChats((prev) => [newChat, ...prev])
      setCurrentChatId(newChat.id)
      
      // Add initial system message
      await handleSendMessage(
        `Great! Let's create a Value Stream Mapping for "${projectName}". I'll help you collect the necessary data.`
      )
    }
  }

  async function handleSendMessage(content: string, role: 'user' | 'assistant' = 'user') {
    if (!currentChatId) return

    // Add user message to UI immediately
    if (role === 'user') {
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: currentChatId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, tempMessage])
    }

    // Save to database
    const savedMessage = await addMessage(currentChatId, role, content)
    
    if (savedMessage && role === 'user') {
      // Replace temp message with saved one
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id.startsWith('temp-') && msg.content === content ? savedMessage : msg
        )
      )

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
          const aiMessage = await addMessage(currentChatId, 'assistant', aiResponse)
          if (aiMessage) {
            setMessages((prev) => [...prev, aiMessage])
          }
        }
      } catch (error) {
        console.error('[Chat] Error getting AI response:', error)
      } finally {
        setIsLoading(false)
      }
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