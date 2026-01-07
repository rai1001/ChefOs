import { useState } from 'react'
import { useActiveOrgId } from '@/modules/orgs/data/activeOrg'
import { useHotels } from '@/modules/events/data/events'
import { useCreateStaffMember, useStaffMembers, useToggleStaffActive } from '../data/staff'
import type { EmploymentType, StaffRole } from '../domain/staff'

const roles: StaffRole[] = ['jefe_cocina', 'cocinero', 'ayudante', 'pasteleria', 'office', 'otros']
const types: EmploymentType[] = ['fijo', 'eventual', 'extra']

export function StaffPage() {
  const { activeOrgId, loading, error } = useActiveOrgId()
  const [onlyActive, setOnlyActive] = useState(true)
  const staff = useStaffMembers(activeOrgId ?? undefined, onlyActive)
  const hotels = useHotels()
  const createStaff = useCreateStaffMember(activeOrgId ?? undefined)
  const toggleActive = useToggleStaffActive(activeOrgId ?? undefined)

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<StaffRole>('cocinero')
  const [employmentType, setEmploymentType] = useState<EmploymentType>('fijo')
  const [homeHotelId, setHomeHotelId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [shiftPattern, setShiftPattern] = useState<'mañana' | 'tarde' | 'rotativo'>('rotativo')
  const [maxShifts, setMaxShifts] = useState<number>(5)

  if (loading) return <p className="p-4 text-sm text-slate-600">Cargando organizacion...</p>
  if (error || !activeOrgId)
    return <p className="p-4 text-sm text-red-600">Selecciona una organizacion valida.</p>

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return
    await createStaff.mutateAsync({
      fullName: fullName.trim(),
      role,
      employmentType,
      homeHotelId: homeHotelId || null,
      notes: notes || null,
      shiftPattern,
      maxShiftsPerWeek: maxShifts,
    })
    setFullName('')
    setRole('cocinero')
    setEmploymentType('fijo')
    setHomeHotelId('')
    setNotes('')
    setShiftPattern('rotativo')
    setMaxShifts(5)
  }

  const hotelMap = (hotels.data ?? []).reduce<Record<string, string>>((acc, h) => {
    acc[h.id] = h.name
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Personal</p>
          <h1 className="text-2xl font-semibold text-slate-900">Staff por organizacion</h1>
          <p className="text-sm text-slate-600">Gestion global de empleados, con hotel base opcional.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
            />
            Mostrar solo activos
          </label>
        </div>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Nuevo empleado</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={onSubmit}>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-700">Nombre completo</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-700">Rol</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-700">Tipo</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-700">Patron turno</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={shiftPattern}
              onChange={(e) => setShiftPattern(e.target.value as any)}
            >
              <option value="mañana">mañana</option>
              <option value="tarde">tarde</option>
              <option value="rotativo">rotativo</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-700">Max turnos/semana</span>
            <input
              type="number"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              min={0}
              max={7}
              value={maxShifts}
              onChange={(e) => setMaxShifts(Number(e.target.value))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-700">Hotel base (opcional)</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={homeHotelId}
              onChange={(e) => setHomeHotelId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {(hotels.data ?? []).map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-3 space-y-1">
            <span className="text-xs font-semibold text-slate-700">Notas (opcional)</span>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={createStaff.isPending}
            >
              {createStaff.isPending ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Listado</h2>
          {staff.isLoading && <span className="text-xs text-slate-500">Cargando...</span>}
        </div>
        <div className="divide-y divide-slate-100">
          {staff.data?.length ? (
            staff.data.map((s) => (
              <div key={s.id} className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{s.fullName}</p>
                  <p className="text-xs text-slate-600">
                    Rol: {s.role} · Tipo: {s.employmentType} · Hotel:{' '}
                    {s.homeHotelId ? hotelMap[s.homeHotelId] ?? s.homeHotelId : 'N/A'}
                  </p>
                </div>
                <button
                  className={`text-xs font-semibold ${s.active ? 'text-amber-700' : 'text-emerald-700'}`}
                  onClick={() => toggleActive.mutate({ id: s.id, active: !s.active })}
                >
                  {s.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            ))
          ) : (
            <p className="px-4 py-6 text-sm text-slate-600">Sin empleados.</p>
          )}
        </div>
      </div>
    </div>
  )
}
