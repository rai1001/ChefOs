import { computeServiceNeedsWithOverrides, type ServiceOverrides } from './overrides'
import type { MenuTemplateItem } from './menu'
import type { ServiceFormat } from './event'

export type ServiceNeed = {
  label: string
  unit: 'kg' | 'ud'
  qty: number
}

export function buildServiceNeeds(params: {
  items: MenuTemplateItem[]
  overrides: ServiceOverrides
  format: ServiceFormat
  pax: number
}): ServiceNeed[] {
  return computeServiceNeedsWithOverrides(params.pax, params.format, params.items, params.overrides)
    .filter((n) => n.qtyRounded > 0)
    .map((n) => ({ label: n.name, unit: n.unit, qty: n.qtyRounded }))
}
