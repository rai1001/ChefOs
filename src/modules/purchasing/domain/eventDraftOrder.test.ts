import { describe, expect, it } from 'vitest'
import { applyRoundingToLines, groupMappedNeeds, mapNeedsToSupplierItems, normalizeAlias, type MappedNeed } from './eventDraftOrder'

const supplierItem = {
  id: 'si1',
  supplierId: 'sup1',
  name: 'Tomate caja',
  purchaseUnit: 'kg' as const,
  packSize: 5,
  roundingRule: 'ceil_pack' as const,
  pricePerUnit: null,
  notes: null,
  createdAt: '',
}

describe('event draft order domain', () => {
  it('normaliza alias', () => {
    expect(normalizeAlias('  Café  !')).toBe('cafe')
  })

  it('mapea needs y marca unknown', () => {
    const needs = [{ label: 'Cafe', unit: 'ud' as const, qty: 10 }]
    const { mapped, unknown } = mapNeedsToSupplierItems(
      needs,
      [{ normalized: 'cafe', supplierItemId: 'si1' }],
      [supplierItem],
    )
    expect(mapped.length).toBe(1)
    expect(unknown.length).toBe(0)
  })

  it('agrupa por proveedor y redondea pack', () => {
    const mapped: MappedNeed[] = [
      { label: 'Tomate', unit: 'kg', qty: 6, supplierItem },
      { label: 'Tomate 2', unit: 'kg', qty: 1, supplierItem },
    ]
    const grouped = groupMappedNeeds(mapped)
    expect(grouped.length).toBe(1)
    const rounded = applyRoundingToLines(grouped)
    expect(rounded[0].lines[0].qty).toBe(10) // 6 -> ceil to pack 5 => 10
  })
})
