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

test('E3: aplicar plantilla y ver necesidades por pax', async ({ page }) => {
  const email = `e2e+menus+${Date.now()}@chefos.test`
  const password = 'Test1234!'
  const orgId = randomUUID()
  const hotelId = randomUUID()
  const eventId = randomUUID()
  const serviceId = randomUUID()
  const templateName = `Plantilla ${Date.now()}`

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

  await admin.from('orgs').insert({ id: orgId, name: 'Org E3', slug: `org-e3-${orgId.slice(0, 6)}` })
  await admin.from('org_memberships').insert({ org_id: orgId, user_id: userId, role: 'owner' })
  await admin.from('hotels').insert({ id: hotelId, org_id: orgId, name: 'Hotel E3' })
  await admin.from('events').insert({
    id: eventId,
    org_id: orgId,
    hotel_id: hotelId,
    title: 'Evento E3',
    status: 'confirmed',
  })
  await admin.from('event_services').insert({
    id: serviceId,
    org_id: orgId,
    event_id: eventId,
    service_type: 'coffee_break',
    format: 'de_pie',
    starts_at: new Date().toISOString(),
    pax: 50,
  })

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

  // Crear plantilla
  await page.goto('/menus')
  await page.getByLabel('Nombre').fill(templateName)
  await page.getByLabel('Categoria').selectOption({ value: 'coffee_break' })
  await page.getByRole('button', { name: /Crear/i }).click()

  await page.getByRole('link', { name: templateName }).click()
  await expect(page.getByRole('heading', { name: templateName })).toBeVisible()

  // Añadir item con ratios
  await page.getByLabel('Nombre').fill('Item E3')
  await page.getByLabel('Qty/pax sentado').fill('1')
  await page.getByLabel('Qty/pax de pie').fill('2')
  await page.getByLabel('Redondeo').selectOption({ value: 'ceil_unit' })
  await page.getByRole('button', { name: /Agregar item/i }).click()
  await expect(page.getByText(/Item E3/)).toBeVisible()

  // Abrir servicio y aplicar plantilla
  await page.goto(`/events/${eventId}`)
  const serviceSection = page.locator('div', { hasText: /coffee_break/i }).first()
  await serviceSection.getByLabel('Plantilla').selectOption({ label: templateName })
  await page.reload()
  const refreshedSection = page.locator('div', { hasText: /coffee_break/i }).first()
  const needRow = refreshedSection.locator('div', { hasText: /Item E3/ }).last()
  await expect(needRow).toBeVisible()
  await expect(needRow.getByText(/100/)).toBeVisible() // 2 * 50 pax
})
