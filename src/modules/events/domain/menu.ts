import { roundRequestedQuantity } from '@/modules/purchasing/domain/rounding'
import type { ServiceFormat } from './event'

export type MenuCategory =
  | 'deportivo'
  | 'turistico'
  | 'empresa'
  | 'coffee_break'
  | 'coctel'
  | 'otros'

export type MenuTemplateItem = {
  id: string
  name: string
  unit: 'ud' | 'kg'
  qtyPerPaxSeated: number
  qtyPerPaxStanding: number
  roundingRule: 'ceil_unit' | 'ceil_pack' | 'none'
  packSize?: number | null
  section?: string | null
  notes?: string | null
}

type ComputedNeed = {
  name: string
  unit: 'ud' | 'kg'
  qtyRaw: number
  qtyRounded: number
}

export function getQtyPerPax(item: MenuTemplateItem, format: ServiceFormat): number {
  return format === 'sentado' ? item.qtyPerPaxSeated : item.qtyPerPaxStanding
}

export function computeMenuNeeds(
  pax: number,
  format: ServiceFormat,
  items: MenuTemplateItem[],
): ComputedNeed[] {
  return items.map((item) => {
    const perPax = getQtyPerPax(item, format)
    const raw = pax * perPax
    const rounded =
      perPax === 0
        ? 0
        : roundRequestedQuantity(raw, item.roundingRule, item.packSize ?? undefined)
    return { name: item.name, unit: item.unit, qtyRaw: raw, qtyRounded: rounded }
  })
}
