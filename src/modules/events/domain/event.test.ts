import { describe, expect, it } from 'vitest'
import { detectOverlaps } from './event'

const baseBooking = {
  id: 'b1',
  startsAt: '2026-01-10T09:00:00Z',
  endsAt: '2026-01-10T11:00:00Z',
}

describe('detectOverlaps', () => {
  it('detecta solape dentro del rango', () => {
    const candidate = { id: 'b2', startsAt: '2026-01-10T10:00:00Z', endsAt: '2026-01-10T10:30:00Z' }
    expect(detectOverlaps([baseBooking], candidate)).toBe(true)
  })

  it('no hay solape si termina justo al inicio', () => {
    const candidate = { id: 'b2', startsAt: '2026-01-10T11:00:00Z', endsAt: '2026-01-10T12:00:00Z' }
    expect(detectOverlaps([baseBooking], candidate)).toBe(false)
  })

  it('no cuenta consigo mismo', () => {
    expect(detectOverlaps([baseBooking], baseBooking)).toBe(false)
  })

  it('ignora fechas invalidas', () => {
    const bad = { id: 'b3', startsAt: 'invalid', endsAt: 'invalid' }
    expect(detectOverlaps([baseBooking], bad)).toBe(false)
  })
})
