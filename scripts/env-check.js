import { config as loadEnv } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const loaded = []
for (const file of ['.env.local', '.env']) {
  const path = resolve(root, file)
  const result = loadEnv({ path, override: false })
  if (result.parsed) loaded.push(file)
}

const url = process.env.VITE_SUPABASE_URL?.trim()
const anon = process.env.VITE_SUPABASE_ANON_KEY?.trim()
const allowInsecure =
  (process.env.VITE_ALLOW_INSECURE_SUPABASE ?? '').toString().trim().toLowerCase() === 'true'
const isCloud =
  typeof url === 'string' && url.includes('supabase.co') && !url.includes('127.0.0.1') && !url.includes('localhost')

console.info(`[env-check] Archivos cargados: ${loaded.length ? loaded.join(', ') : 'ninguno'}`)
console.info(`[env-check] Supabase URL: ${url || '(missing)'}`)
console.info(`[env-check] Destino: ${isCloud ? 'cloud' : 'local/otro'}${allowInsecure ? ' (insecure allowed)' : ''}`)

if (!url || !anon) {
  console.error(
    '[env-check] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY (revisa .env.local en la raíz).',
  )
  process.exit(1)
}
