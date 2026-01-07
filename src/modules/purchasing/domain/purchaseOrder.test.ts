import { describe, expect, it } from 'vitest'
import {
  applyReceivingToStock,
  applyRoundingToRequested,
  assertValidStatusTransition,
  computeLineTotal,
  computeOrderTotal,
} from './purchaseOrder'

describe('assertValidStatusTransition', () => {
  it('permite transiciones válidas', () => {
    expect(() => assertValidStatusTransition('draft', 'confirmed')).not.toThrow()
    expect(() => assertValidStatusTransition('confirmed', 'received')).not.toThrow()
  })

  it('rechaza transiciones inválidas', () => {
    expect(() => assertValidStatusTransition('received', 'draft')).toThrow()
    expect(() => assertValidStatusTransition('cancelled', 'confirmed')).toThrow()
  })
})

describe('computeLineTotal', () => {
  it('multiplica cantidad por precio', () => {
    expect(computeLineTotal(5, 2)).toBe(10)
  })

  it('devuelve 0 si no hay precio', () => {
    expect(computeLineTotal(5, null)).toBe(0)
  })
})

describe('computeOrderTotal', () => {
  it('suma totales de líneas', () => {
    expect(computeOrderTotal([{ lineTotal: 5 }, { lineTotal: 2.5 }])).toBe(7.5)
  })
})

describe('applyRoundingToRequested', () => {
  it('aplica ceil_unit', () => {
    expect(applyRoundingToRequested(2.1, 'ceil_unit')).toBe(3)
  })

  it('aplica ceil_pack', () => {
    expect(applyRoundingToRequested(7, 'ceil_pack', 5)).toBe(10)
  })
})

describe('applyReceivingToStock', () => {
  it('suma al stock', () => {
    expect(applyReceivingToStock(10, 5)).toBe(15)
  })

  it('lanza si negativo', () => {
    expect(() => applyReceivingToStock(10, -1)).toThrow()
  })
})
