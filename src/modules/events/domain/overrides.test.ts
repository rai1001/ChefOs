import { describe, expect, it } from 'vitest'
import { computeServiceNeedsWithOverrides, type ServiceOverrides } from './overrides'
import type { MenuTemplateItem } from './menu'

const tmpl: MenuTemplateItem = {
  id: 't1',
  name: 'Item',
  unit: 'ud',
  qtyPerPaxSeated: 1,
  qtyPerPaxStanding: 2,
  roundingRule: 'ceil_unit',
  packSize: null,
}

describe('overrides', () => {
  it('excluir elimina item', () => {
    const overrides: ServiceOverrides = { excluded: [{ templateItemId: 't1' }], added: [], replaced: [] }
    const res = computeServiceNeedsWithOverrides(10, 'sentado', [tmpl], overrides)
    expect(res.length).toBe(0)
  })

  it('add suma item', () => {
    const overrides: ServiceOverrides = {
      excluded: [],
      replaced: [],
      added: [
        {
          name: 'Extra',
          unit: 'ud',
          qtyPerPaxSeated: 1,
          qtyPerPaxStanding: 0,
          roundingRule: 'ceil_unit',
        },
      ],
    }
    const res = computeServiceNeedsWithOverrides(5, 'sentado', [tmpl], overrides)
    expect(res.find((r) => r.name === 'Extra')?.qtyRounded).toBe(5)
  })

  it('replace sustituye ratios', () => {
    const overrides: ServiceOverrides = {
      excluded: [],
      added: [],
      replaced: [
        {
          templateItemId: 't1',
          replacement: {
            name: 'Nuevo',
            unit: 'ud',
            qtyPerPaxSeated: 2,
            qtyPerPaxStanding: 2,
            roundingRule: 'ceil_unit',
          },
        },
      ],
    }
    const res = computeServiceNeedsWithOverrides(10, 'sentado', [tmpl], overrides)
    const nuevo = res.find((r) => r.name === 'Nuevo')
    expect(nuevo?.qtyRounded).toBe(20)
    expect(res.some((r) => r.name === 'Item')).toBe(false)
  })
})
