import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseClient: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para inicializar Supabase.')
  }
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
