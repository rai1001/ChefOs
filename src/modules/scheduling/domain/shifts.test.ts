import { describe, expect, it } from 'vitest'
import { computeMissing, getWeekDays, validateShiftWindow } from './shifts'

describe('computeMissing', () => {
  it('returns zero when covered', () => {
    expect(computeMissing(2, 2)).toBe(0)
    expect(computeMissing(2, 3)).toBe(0)
  })

  it('returns remaining when lacking', () => {
    expect(computeMissing(3, 1)).toBe(2)
  })
})

describe('validateShiftWindow', () => {
  it('validates order', () => {
    expect(validateShiftWindow('08:00', '12:00')).toBe(true)
    expect(validateShiftWindow('12:00', '08:00')).toBe(false)
  })
})

describe('getWeekDays', () => {
  it('produces seven consecutive dates', () => {
    const days = getWeekDays('2026-01-05')
    expect(days.length).toBe(7)
    expect(days[0]).toBe('2026-01-05')
    expect(days[6]).toBe('2026-01-11')
  })
})
