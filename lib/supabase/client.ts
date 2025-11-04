"use client"

import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client that won't be used
    return null as any
  }

  if (client) return client

  client = createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        // Read cookie from document.cookie
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(";").shift()
      },
      set(name: string, value: string, options: any) {
        // Write cookie to document.cookie
        let cookie = `${name}=${value}`
        if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
        if (options?.path) cookie += `; path=${options.path}`
        if (options?.domain) cookie += `; domain=${options.domain}`
        if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
        if (options?.secure) cookie += "; secure"
        document.cookie = cookie
      },
      remove(name: string, options: any) {
        // Remove cookie by setting max-age to 0
        let cookie = `${name}=; max-age=0`
        if (options?.path) cookie += `; path=${options.path}`
        if (options?.domain) cookie += `; domain=${options.domain}`
        document.cookie = cookie
      },
    },
  })

  return client
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
