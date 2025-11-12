import { getSupabaseBrowserClient } from './client'

export async function createNewChat(userId: string, projectName: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

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
}

export async function getUserChats(userId: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

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
}

export async function getChatMessages(chatId: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

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
}

export async function addMessage(chatId: string, role: 'user' | 'assistant', content: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      role,
      content,
    })
    .select()
    .single()

  if (error) {
    console.error('[Supabase] Error adding message:', error)
    return null
  }

  // Update chat's updated_at timestamp
  await supabase
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatId)

  return data
}