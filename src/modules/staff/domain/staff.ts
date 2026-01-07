export type StaffRole = 'jefe_cocina' | 'cocinero' | 'ayudante' | 'pasteleria' | 'office' | 'otros'
export type EmploymentType = 'fijo' | 'eventual' | 'extra'

export type StaffMember = {
  id: string
  orgId: string
  homeHotelId?: string | null
  fullName: string
  role: StaffRole
  employmentType: EmploymentType
  phone?: string | null
  email?: string | null
  notes?: string | null
  active: boolean
  createdAt?: string
  shiftPattern?: 'mañana' | 'tarde' | 'rotativo'
  maxShiftsPerWeek?: number
}

export function validateStaffMemberInput(input: {
  fullName: string
  role: string
  employmentType: string
}) {
  if (!input.fullName || !input.fullName.trim()) {
    throw new Error('Nombre obligatorio')
  }
  const role: StaffRole[] = ['jefe_cocina', 'cocinero', 'ayudante', 'pasteleria', 'office', 'otros']
  const types: EmploymentType[] = ['fijo', 'eventual', 'extra']
  if (!role.includes(input.role as StaffRole)) {
    throw new Error('Rol invalido')
  }
  if (!types.includes(input.employmentType as EmploymentType)) {
    throw new Error('Tipo invalido')
  }
}
