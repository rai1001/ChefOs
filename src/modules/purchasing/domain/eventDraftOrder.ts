import { roundRequestedQuantity } from '@/modules/purchasing/domain/rounding'
import type { SupplierItem } from './types'

export function normalizeAlias(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export type Need = { label: string; unit: 'kg' | 'ud'; qty: number }

export type MappedNeed = Need & { supplierItem: SupplierItem }

export function mapNeedsToSupplierItems(
  needs: Need[],
  aliases: { normalized: string; supplierItemId: string }[],
  supplierItems: SupplierItem[],
): { mapped: MappedNeed[]; unknown: Need[] } {
  const aliasMap = new Map(aliases.map((a) => [a.normalized, a.supplierItemId]))
  const supplierMap = new Map(supplierItems.map((s) => [s.id, s]))
  const mapped: MappedNeed[] = []
  const unknown: Need[] = []
  for (const need of needs) {
    const norm = normalizeAlias(need.label)
    const supplierId = aliasMap.get(norm)
    if (!supplierId) {
      unknown.push(need)
      continue
    }
    const supplierItem = supplierMap.get(supplierId)
    if (!supplierItem) {
      unknown.push(need)
      continue
    }
    mapped.push({ ...need, supplierItem })
  }
  return { mapped, unknown }
}

export function groupMappedNeeds(mapped: MappedNeed[]) {
  const bySupplier = new Map<
    string,
    { supplierId: string; lines: { supplierItem: SupplierItem; label: string; qty: number; unit: 'kg' | 'ud' }[] }
  >()
  for (const need of mapped) {
    const supplierId = need.supplierItem.supplierId
    if (!bySupplier.has(supplierId)) {
      bySupplier.set(supplierId, { supplierId, lines: [] })
    }
    bySupplier.get(supplierId)!.lines.push({
      supplierItem: need.supplierItem,
      label: need.label,
      qty: need.qty,
      unit: need.supplierItem.purchaseUnit,
    })
  }
  return Array.from(bySupplier.values())
}

export function applyRoundingToLines(
  groups: ReturnType<typeof groupMappedNeeds>,
): ReturnType<typeof groupMappedNeeds> {
  return groups.map((g) => ({
    supplierId: g.supplierId,
    lines: g.lines.map((line) => {
      const rounded = roundRequestedQuantity(
        line.qty,
        line.supplierItem.roundingRule,
        line.supplierItem.packSize ?? undefined,
      )
      return { ...line, qty: rounded }
    }),
  }))
}
