import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import {
  createUserWithRetry,
  getAnonStorageKey,
  getServiceClients,
  injectSession,
  signInWithRetry,
} from './utils/auth'

test('S1: crear y desactivar staff', async ({ page }) => {
  const email = `e2e+staff+${Date.now()}@chefos.test`
  const password = 'Test1234!'
  const orgId = randomUUID()
  const hotelId = randomUUID()
  const staffName = `Empleado ${Date.now()}`

  const { admin, anon, anonKey, url } = getServiceClients()
  const user = await createUserWithRetry(admin, email, password)
  const storageKey = getAnonStorageKey(url, anon)

  await admin.from('orgs').insert({ id: orgId, name: 'Org Staff', slug: `org-staff-${orgId.slice(0, 6)}` })
  await admin.from('org_memberships').insert({ org_id: orgId, user_id: user.id, role: 'owner' })
  await admin.from('hotels').insert({ id: hotelId, org_id: orgId, name: 'Hotel Staff' })

  const session = await signInWithRetry(anon, email, password)
  await injectSession(page, storageKey, session, url, anonKey)
  await page.addInitScript(({ org }) => localStorage.setItem('activeOrgId', org), { org: orgId })

  await page.goto('/staff')
  await expect(page.getByText('Staff por organizacion')).toBeVisible()

  await page.getByLabel('Nombre completo').fill(staffName)
  await page.getByLabel('Rol').selectOption('cocinero')
  await page.getByLabel('Tipo').selectOption('fijo')
  await page.getByRole('button', { name: 'Crear' }).click()
  await expect(page.getByText(staffName)).toBeVisible({ timeout: 10000 })

  const toggleBtn = page.getByRole('button', { name: /Desactivar/i }).first()
  await toggleBtn.click()
  await expect(page.getByRole('button', { name: /Activar/i })).toBeVisible({ timeout: 10000 })
})
