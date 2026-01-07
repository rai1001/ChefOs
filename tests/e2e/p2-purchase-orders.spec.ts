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

test('P2: crear, confirmar y recibir pedido actualizando stock', async ({ page }) => {
  const email = `e2e+p2+${Date.now()}@chefos.test`
  const password = 'Test1234!'
  const orgId = randomUUID()
  const hotelId = randomUUID()
  const ingredientId = randomUUID()
  const supplierId = randomUUID()
  const supplierItemId = randomUUID()
  const orderNumber = `PO-${Date.now()}`

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const storageKey =
    (anon.auth as any).storageKey ||
    `sb-${new URL(SUPABASE_URL).host}-auth-token` ||
    `sb-${new URL(SUPABASE_URL).hostname}-auth-token`

  // Setup data
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (userError || !userData.user) throw userError || new Error('No se pudo crear usuario')
  const userId = userData.user.id

  await admin.from('orgs').insert({ id: orgId, name: 'Org E2E P2', slug: `org-e2e-p2-${orgId.slice(0, 6)}` })
  await admin
    .from('org_memberships')
    .insert({ org_id: orgId, user_id: userId, role: 'owner' })
  await admin
    .from('hotels')
    .insert({ id: hotelId, org_id: orgId, name: 'Hotel E2E' })
  await admin
    .from('ingredients')
    .insert({ id: ingredientId, org_id: orgId, hotel_id: hotelId, name: 'Ingrediente E2E', base_unit: 'ud', stock: 0 })
  await admin
    .from('suppliers')
    .insert({ id: supplierId, org_id: orgId, name: 'Proveedor E2E' })
  await admin
    .from('supplier_items')
    .insert({
      id: supplierItemId,
      supplier_id: supplierId,
      name: 'Item E2E',
      purchase_unit: 'ud',
      rounding_rule: 'ceil_unit',
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

  // Create order
  await page.goto('/purchasing/orders')
  await page.getByRole('link', { name: /Nuevo pedido/i }).click()
  await page.getByLabel('Hotel').selectOption({ label: 'Hotel E2E' })
  await page.getByLabel('Proveedor').selectOption({ label: 'Proveedor E2E' })
  await page.getByLabel('Número de pedido').fill(orderNumber)
  await page.getByRole('button', { name: /Crear pedido/i }).click()

  await expect(page.getByRole('heading', { name: new RegExp(orderNumber, 'i') })).toBeVisible()

  // Add line
  await page.getByLabel('Artículo proveedor').selectOption({ label: 'Item E2E' })
  await page.getByLabel('Ingrediente').selectOption({ label: 'Ingrediente E2E' })
  await page.getByLabel('Cantidad solicitada').fill('5')
  await page.getByRole('button', { name: /Añadir línea/i }).click()

  await expect(page.getByText(/Artículo prov: Item E2E/i)).toBeVisible()

  // Confirm
  await page.getByRole('button', { name: /Confirmar/i }).click()
  await expect(page.getByText(/Estado: confirmed/i)).toBeVisible()

  // Receive (use default values)
  await page.getByRole('button', { name: /Recibir/i }).click()
  await expect(page.getByText(/Estado: received/i)).toBeVisible()

  // Check stock
  await page.goto('/purchasing/stock')
  await page.getByRole('combobox').selectOption({ label: 'Hotel E2E' })
  const row = page.locator('div', { hasText: 'Ingrediente E2E' }).first()
  await expect(row).toBeVisible()
  await expect(row.getByText('5')).toBeVisible()
})
