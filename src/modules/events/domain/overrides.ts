import { roundRequestedQuantity } from '@/modules/purchasing/domain/rounding'
import type { ServiceFormat } from './event'
import type { MenuTemplateItem } from './menu'

export type ExcludedItem = { templateItemId: string }

export type AddedItem = {
  name: string
  unit: 'ud' | 'kg'
  qtyPerPaxSeated: number
  qtyPerPaxStanding: number
  roundingRule: 'ceil_unit' | 'ceil_pack' | 'none'
  packSize?: number | null
  section?: string | null
  notes?: string | null
}

export type ReplacedItem = {
  templateItemId: string
  replacement: AddedItem
}

export type ServiceOverrides = {
  excluded: ExcludedItem[]
  added: AddedItem[]
  replaced: ReplacedItem[]
}

export function applyMenuOverrides(
  templateItems: MenuTemplateItem[],
  overrides: ServiceOverrides,
): MenuTemplateItem[] {
  const excludedIds = new Set(overrides.excluded.map((e) => e.templateItemId))
  const replacedMap = new Map(overrides.replaced.map((r) => [r.templateItemId, r.replacement]))

  const base = templateItems
    .filter((item) => !excludedIds.has(item.id) && !replacedMap.has(item.id))
    .map((item) => item)

  const replacements = overrides.replaced.map((r) => ({
    id: `repl-${r.templateItemId}`,
    name: r.replacement.name,
    unit: r.replacement.unit,
    qtyPerPaxSeated: r.replacement.qtyPerPaxSeated,
    qtyPerPaxStanding: r.replacement.qtyPerPaxStanding,
    roundingRule: r.replacement.roundingRule,
    packSize: r.replacement.packSize,
    section: r.replacement.section,
  }))

  const added = overrides.added.map((a, idx) => ({
    id: `add-${idx}`,
    name: a.name,
    unit: a.unit,
    qtyPerPaxSeated: a.qtyPerPaxSeated,
    qtyPerPaxStanding: a.qtyPerPaxStanding,
    roundingRule: a.roundingRule,
    packSize: a.packSize,
    section: a.section,
  }))

  return [...base, ...replacements, ...added]
}

export function computeServiceNeedsWithOverrides(
  pax: number,
  format: ServiceFormat,
  templateItems: MenuTemplateItem[],
  overrides: ServiceOverrides,
) {
  const finalItems = applyMenuOverrides(templateItems, overrides)
  return finalItems.map((item) => {
    const perPax = format === 'sentado' ? item.qtyPerPaxSeated : item.qtyPerPaxStanding
    const raw = pax * perPax
    const rounded =
      perPax === 0
        ? 0
        : roundRequestedQuantity(raw, item.roundingRule, item.packSize ?? undefined)
    return { name: item.name, unit: item.unit, qtyRaw: raw, qtyRounded: rounded, section: item.section }
  })
}
