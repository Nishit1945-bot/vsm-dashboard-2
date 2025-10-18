"use client"

import { useChat } from "ai/react"

export function useAIChat(chatId: string | null, userId: string | null, onNewMessage?: (message: any) => void) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: {
      chatId,
      userId,
    },
    onFinish: (message) => {
      if (onNewMessage) {
        onNewMessage(message)
      }
    },
  })

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  }
}
