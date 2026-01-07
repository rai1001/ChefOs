import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'supabase/.env' })
dotenv.config({ path: '.env.local' })
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Faltan variables SUPABASE_URL/ANON/SERVICE_ROLE para e2e.')
}

function toLocalInput(dt: Date) {
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

test('E1: crear sal¢n, evento y reserva', async ({ page }) => {
  const email = `e2e+events+${Date.now()}@chefos.test`
  const password = 'Test1234!'
  const orgId = randomUUID()
  const hotelId = randomUUID()

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const storageKey =
    (anon.auth as any).storageKey ||
    `sb-${new URL(SUPABASE_URL).host}-auth-token` ||
    `sb-${new URL(SUPABASE_URL).hostname}-auth-token`

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (userError || !userData.user) throw userError || new Error('No se pudo crear usuario')
  const userId = userData.user.id

  await admin.from('orgs').insert({ id: orgId, name: 'Org E2E Eventos', slug: `org-e2e-events-${orgId.slice(0, 6)}` })
  await admin.from('org_memberships').insert({ org_id: orgId, user_id: userId, role: 'owner' })
  await admin.from('hotels').insert({ id: hotelId, org_id: orgId, name: 'Hotel E2E Eventos' })

  const { data: sessionData, error: signinError } = await anon.auth.signInWithPassword({
    email,
    password,
  })
  if (signinError || !sessionData.session) throw signinError || new Error('No pudo loguear')

  await page.addInitScript(
    ({ key, session }) => {
      ;(window as any).__E2E_SESSION__ = session
      window.localStorage.setItem(
        key,
        JSON.stringify({ currentSession: session, expiresAt: session?.expires_at }),
      )
    },
    { key: storageKey, session: sessionData.session },
  )

  // ir al tablero y crear sal¢n
  await page.goto('/events')
  await page.getByRole('combobox').first().selectOption({ label: 'Hotel E2E Eventos' })
  await page.getByPlaceholder('Nombre').fill('Sala E2E')
  await page.getByPlaceholder('Capacidad').fill('50')
  await page.getByRole('button', { name: /Crear sal¢n/i }).click()
  await expect(page.getByText(/Sala E2E/i)).toBeVisible()

  // crear evento
  await page.getByRole('link', { name: /Nuevo evento/i }).click()
  await page.getByLabel('Hotel').selectOption({ label: 'Hotel E2E Eventos' })
  await page.getByLabel('T¡tulo').fill('Evento E2E')
  await page.getByLabel('Estado').selectOption({ value: 'confirmed' })
  await page.getByRole('button', { name: /Crear evento/i }).click()

  await expect(page.getByRole('heading', { name: /Evento E2E/i })).toBeVisible()

  // crear reserva
  const start = toLocalInput(new Date(Date.now() + 60 * 60 * 1000))
  const end = toLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000))
  await page.getByLabel('Sal¢n').selectOption({ label: 'Sala E2E' })
  await page.getByLabel('Inicio').fill(start)
  await page.getByLabel('Fin').fill(end)
  await page.getByRole('button', { name: /A¤adir reserva/i }).click()

  const bookingRow = page.locator('div').filter({ hasText: /Sala E2E/ }).first()
  await expect(bookingRow).toBeVisible()
  await expect(bookingRow.getByRole('button', { name: /Borrar/i })).toBeVisible()
})
