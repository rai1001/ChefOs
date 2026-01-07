import { describe, expect, it } from 'vitest'
import { validateStaffMemberInput } from './staff'

describe('staff domain', () => {
  it('valida nombre requerido', () => {
    expect(() => validateStaffMemberInput({ fullName: '', role: 'cocinero', employmentType: 'fijo' })).toThrow()
  })

  it('valida enums', () => {
    expect(() =>
      validateStaffMemberInput({ fullName: 'Ana', role: 'cocinero', employmentType: 'fijo' }),
    ).not.toThrow()
    expect(() =>
      validateStaffMemberInput({ fullName: 'Ana', role: 'invalid', employmentType: 'fijo' }),
    ).toThrow()
    expect(() =>
      validateStaffMemberInput({ fullName: 'Ana', role: 'cocinero', employmentType: 'otro' }),
    ).toThrow()
  })
})
