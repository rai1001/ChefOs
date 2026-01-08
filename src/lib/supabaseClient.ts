import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from '@/config/env'

const env = getEnv()
export const supabaseClient: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey)

export function getSupabaseClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    const e2eSession = (window as any).__E2E_SESSION__
    if (e2eSession && (supabaseClient as any).__e2eSessionApplied !== e2eSession?.access_token) {
      ;(supabaseClient as any).__e2eSessionApplied = e2eSession?.access_token
      supabaseClient.auth.setSession(e2eSession).catch(() => {
        /* no-op en e2e */
      })
    }
  }
  return supabaseClient
}
