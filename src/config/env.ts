type RawEnv = ImportMetaEnv & {
  VITE_ALLOW_INSECURE_SUPABASE?: string
}

export type AppEnv = {
  supabaseUrl: string
  supabaseAnonKey: string
  allowInsecure: boolean
  isDev: boolean
}

function normalizeUrl(url: string, allowInsecure: boolean) {
  const trimmed = url.trim()
  if (!trimmed) {
    throw new Error(
      'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (revisa .env.local en la raíz).',
    )
  }
  if (!allowInsecure && trimmed.startsWith('http://')) {
    throw new Error(
      'VITE_SUPABASE_URL debe empezar por https:// (o usa VITE_ALLOW_INSECURE_SUPABASE=true solo para entornos controlados).',
    )
  }
  return trimmed
}

export function readEnv(rawEnv: RawEnv = import.meta.env as RawEnv): AppEnv {
  const allowInsecure =
    (rawEnv.VITE_ALLOW_INSECURE_SUPABASE ?? '').toString().trim().toLowerCase() === 'true'
  const supabaseUrl = normalizeUrl(rawEnv.VITE_SUPABASE_URL ?? '', allowInsecure)
  const supabaseAnonKey = (rawEnv.VITE_SUPABASE_ANON_KEY ?? '').trim()

  if (!supabaseAnonKey) {
    throw new Error(
      'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (revisa .env.local en la raíz).',
    )
  }

  const env: AppEnv = {
    supabaseUrl,
    supabaseAnonKey,
    allowInsecure,
    isDev: Boolean(rawEnv.DEV),
  }

  if (env.isDev) {
    console.info('[Supabase] URL:', env.supabaseUrl)
  }

  return env
}

let cachedEnv: AppEnv | null = null

export function getEnv(rawEnv?: RawEnv): AppEnv {
  if (rawEnv) return readEnv(rawEnv)
  if (!cachedEnv) {
    cachedEnv = readEnv()
  }
  return cachedEnv
}
