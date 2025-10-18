"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function createNewChat() {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: newChat, error } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      title: "New VSM Chat",
      project_name: "",
    })
    .select()
    .single()

  if (error) {
    console.error("[Server] Error creating chat:", error)
    return { error: error.message }
  }

  return { data: newChat }
}
