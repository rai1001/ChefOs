import { describe, expect, it } from 'vitest'
import { computeRecipeNeeds, scaleRecipeLines, type RecipeLine } from './recipes'

describe('recipes domain', () => {
  const lines: RecipeLine[] = [
    { productId: 'p1', qty: 2, unit: 'kg', productBaseUnit: 'kg' },
    { productId: 'p2', qty: 10, unit: 'ud', productBaseUnit: 'ud' },
  ]

  it('escala lineas segun raciones', () => {
    const scaled = scaleRecipeLines(lines, 10, 50)
    expect(scaled[0].qty).toBeCloseTo(10)
    expect(scaled[1].qty).toBeCloseTo(50)
  })

  it('valida raciones mayores que cero', () => {
    expect(() => scaleRecipeLines(lines, 0, 10)).toThrow()
    expect(() => computeRecipeNeeds(lines, -1, 10)).toThrow()
  })

  it('calcula necesidades respetando unidad base', () => {
    const needs = computeRecipeNeeds(lines, 20, 10)
    expect(needs.find((n) => n.productId === 'p1')?.qty).toBeCloseTo(4)
  })

  it('rompe si la unidad no coincide con la base del producto', () => {
    const wrong: RecipeLine[] = [{ productId: 'p1', qty: 1, unit: 'ud', productBaseUnit: 'kg' }]
    expect(() => computeRecipeNeeds(wrong, 10, 10)).toThrow()
  })
})
