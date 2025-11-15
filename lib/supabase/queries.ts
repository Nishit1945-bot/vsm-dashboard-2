// lib/supabase/queries.ts
import { getSupabaseBrowserClient } from './client'
import type { Chat, Message } from '@/types'

export async function getUserChats(userId: string): Promise<Chat[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Supabase] Error fetching chats:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[Supabase] Exception fetching chats:', err)
    return []
  }
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Supabase] Error fetching messages:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[Supabase] Exception fetching messages:', err)
    return []
  }
}

export async function createNewChat(userId: string, projectName: string): Promise<Chat | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: userId,
        title: projectName,
        project_name: projectName,
      })
      .select()
      .single()

    if (error) {
      console.error('[Supabase] Error creating chat:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('[Supabase] Exception creating chat:', err)
    return null
  }
}

export async function addMessage(
  chatId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<Message | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    console.error('[Supabase] No client available')
    return null
  }

  try {
    console.log('[Supabase] Adding message:', { chatId, role, content: content.substring(0, 50) })
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: role,
        content: content,
      })
      .select()
      .single()

    if (error) {
      console.error('[Supabase] Error adding message:', error)
      console.error('[Supabase] Error details:', JSON.stringify(error, null, 2))
      return null
    }

    console.log('[Supabase] Message added successfully:', data.id)
    return data
  } catch (err) {
    console.error('[Supabase] Exception adding message:', err)
    return null
  }
}