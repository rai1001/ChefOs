import { describe, expect, it } from 'vitest'
import { computeMenuNeeds, getQtyPerPax, type MenuTemplateItem } from './menu'

const baseItem: MenuTemplateItem = {
  id: '1',
  name: 'Bocadillo',
  unit: 'ud',
  qtyPerPaxSeated: 1,
  qtyPerPaxStanding: 2,
  roundingRule: 'ceil_unit',
}

describe('getQtyPerPax', () => {
  it('elige ratio por formato', () => {
    expect(getQtyPerPax(baseItem, 'sentado')).toBe(1)
    expect(getQtyPerPax(baseItem, 'de_pie')).toBe(2)
  })
})

describe('computeMenuNeeds', () => {
  it('calcula cantidades para formato sentado', () => {
    const res = computeMenuNeeds(10, 'sentado', [baseItem])
    expect(res[0].qtyRaw).toBe(10)
    expect(res[0].qtyRounded).toBe(10)
  })

  it('aplica ceil_pack con pack_size', () => {
    const item: MenuTemplateItem = { ...baseItem, roundingRule: 'ceil_pack', packSize: 5 }
    const res = computeMenuNeeds(9, 'sentado', [item])
    expect(res[0].qtyRounded).toBe(10) // 9 -> ceil to pack 5
  })

  it('devuelve 0 si ratio es 0 para ese formato', () => {
    const item: MenuTemplateItem = { ...baseItem, qtyPerPaxStanding: 0 }
    const res = computeMenuNeeds(50, 'de_pie', [item])
    expect(res[0].qtyRounded).toBe(0)
  })
})
