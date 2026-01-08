import { describe, expect, it } from 'vitest'
import { readEnv } from './env'

describe('readEnv', () => {
  it('lanza si faltan variables', () => {
    expect(() =>
      readEnv({
        VITE_SUPABASE_URL: '',
        VITE_SUPABASE_ANON_KEY: '',
        DEV: false,
      } as any),
    ).toThrow(/Configura VITE_SUPABASE_URL/i)
  })

  it('acepta https y hace trim', () => {
    const env = readEnv({
      VITE_SUPABASE_URL: ' https://example.supabase.co ',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
      DEV: false,
    } as any)
    expect(env.supabaseUrl).toBe('https://example.supabase.co')
    expect(env.supabaseAnonKey).toBe('anon-key')
    expect(env.allowInsecure).toBe(false)
  })

  it('rechaza http si no se permite inseguro', () => {
    expect(() =>
      readEnv({
        VITE_SUPABASE_URL: 'http://example.supabase.test',
        VITE_SUPABASE_ANON_KEY: 'anon-key',
        DEV: false,
      } as any),
    ).toThrow(/https:\/\//i)
  })

  it('permite http si se activa VITE_ALLOW_INSECURE_SUPABASE', () => {
    const env = readEnv({
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
      VITE_ALLOW_INSECURE_SUPABASE: 'true',
      DEV: false,
    } as any)
    expect(env.supabaseUrl).toBe('http://localhost:54321')
    expect(env.allowInsecure).toBe(true)
  })
})
