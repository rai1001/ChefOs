import { describe, expect, it } from 'vitest'
import { endOfWeek, startOfWeek } from './week'

describe('week helpers', () => {
  it('calcula lunes como inicio de semana', () => {
    const date = new Date('2026-01-07T12:00:00Z') // miercoles
    const start = startOfWeek(date)
    expect(start.toISOString().slice(0, 10)).toBe('2026-01-05')
  })

  it('calcula domingo como fin de semana', () => {
    const start = new Date('2026-01-05T00:00:00Z')
    const end = endOfWeek(start)
    expect(end.toISOString().slice(0, 10)).toBe('2026-01-11')
    expect(end.getUTCHours()).toBe(23)
  })
})
