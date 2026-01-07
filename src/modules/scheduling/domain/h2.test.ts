import { describe, expect, it } from 'vitest'
import { buildOffPlan, canWorkShift, scoreCandidate } from './h2'

describe('canWorkShift', () => {
  it('respects patterns', () => {
    expect(canWorkShift('mañana', 'mañana')).toBe(true)
    expect(canWorkShift('mañana', 'tarde')).toBe(false)
    expect(canWorkShift('rotativo', 'tarde')).toBe(true)
  })
})

describe('scoreCandidate', () => {
  it('prefers lower assignments and matching pattern', () => {
    const a = { id: 'a', shiftPattern: 'rotativo' as const, weekAssigned: 1 as const }
    const b = { id: 'b', shiftPattern: 'mañana' as const, weekAssigned: 1 as const }
    expect(scoreCandidate(a, 'mañana')).toBeLessThan(scoreCandidate(b, 'mañana'))
  })
})

describe('buildOffPlan', () => {
  it('builds map of off days', () => {
    const map = buildOffPlan(['x'])
    expect(map.get('x')?.length).toBe(2)
  })
})
