import '@testing-library/jest-dom/vitest'

// Valores dummy para evitar fallos de carga de env en tests (no se usan llamadas reales).
const testEnv = import.meta.env as any
testEnv.VITE_SUPABASE_URL ??= 'https://example.supabase.co'
testEnv.VITE_SUPABASE_ANON_KEY ??= 'test-anon-key'
