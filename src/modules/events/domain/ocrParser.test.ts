import { describe, expect, it } from 'vitest'
import { parseOcrText } from './ocrParser'

const sample = `DESAYUNO 08:00 80 pax
BEBIDAS:
Cafe
Zumo

ENTRANTES:
Fruta
`

describe('parseOcrText', () => {
  it('detecta servicio y pax', () => {
    const draft = parseOcrText(sample)
    expect(draft.detectedServices[0].serviceType).toBe('desayuno')
    expect(draft.detectedServices[0].paxGuess).toBe(80)
    expect(draft.detectedServices[0].startsAtGuess).toBe('08:00')
  })

  it('crea secciones e items', () => {
    const draft = parseOcrText(sample)
    const secciones = draft.detectedServices[0].sections
    expect(secciones[0].title.toLowerCase()).toContain('bebidas')
    expect(secciones[0].items).toContain('Cafe')
    expect(secciones[1].items).toContain('Fruta')
  })
})
