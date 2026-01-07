import { useState } from 'react'
import { useActiveOrgId } from '@/modules/orgs/data/activeOrg'
import { useHotels } from '@/modules/events/data/events'
import { useGenerateRoster, useSchedulingRules, useSaveSchedulingRules } from '../data/h2'

export function RosterGeneratorPage() {
  const { activeOrgId, loading, error } = useActiveOrgId()
  const hotels = useHotels()
  const [hotelId, setHotelId] = useState('')
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    return monday.toISOString().slice(0, 10)
  })
  const rules = useSchedulingRules(hotelId)
  const saveRules = useSaveSchedulingRules()
  const generate = useGenerateRoster(hotelId, weekStart)
  const [preview, setPreview] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (loading) return <p className="p-4 text-sm text-slate-600">Cargando organizacion...</p>
  if (error || !activeOrgId) return <p className="p-4 text-sm text-red-600">Selecciona una organizacion valida.</p>

  const onPreview = async () => {
    setErrorMsg(null)
    try {
      const data = await generate.mutateAsync(false)
      setPreview(data)
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Error al generar')
    }
  }

  const onApply = async () => {
    setErrorMsg(null)
    try {
      await generate.mutateAsync(true)
      const data = await generate.mutateAsync(false)
      setPreview(data)
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Error al aplicar')
    }
  }

  const ruleForm = rules.data || {
    orgId: activeOrgId,
    hotelId,
    morningRequiredWeekday: 1,
    morningRequiredWeekend: 2,
    afternoonRequiredDaily: 1,
    enforceTwoConsecutiveDaysOff: true,
    enforceOneWeekendOffPer30d: true,
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Roster</p>
        <h1 className="text-2xl font-semibold text-slate-900">Generador semanal (H2)</h1>
        <p className="text-sm text-slate-600">Previsualiza turnos mañana/tarde respetando reglas básicas.</p>
        {errorMsg && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>}
      </header>

      <div className="grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="text-xs font-semibold text-slate-700">Hotel</span>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
          >
            <option value="">Selecciona hotel</option>
            {(hotels.data ?? []).map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-xs font-semibold text-slate-700">Semana (lunes)</span>
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={onPreview}
            disabled={!hotelId || !weekStart}
          >
            Previsualizar
          </button>
          <button
            className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            onClick={onApply}
            disabled={!hotelId || !weekStart}
          >
            Aplicar
          </button>
        </div>
      </div>

      <div className="rounded border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Reglas del hotel</h2>
        <form
          className="mt-3 grid gap-3 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!hotelId) return
            saveRules.mutate({
              orgId: activeOrgId,
              hotelId,
              morningRequiredWeekday: ruleForm.morningRequiredWeekday,
              morningRequiredWeekend: ruleForm.morningRequiredWeekend,
              afternoonRequiredDaily: ruleForm.afternoonRequiredDaily,
              enforceTwoConsecutiveDaysOff: ruleForm.enforceTwoConsecutiveDaysOff,
              enforceOneWeekendOffPer30d: ruleForm.enforceOneWeekendOffPer30d,
            })
          }}
        >
          <label className="text-sm">
            <span className="text-xs font-semibold text-slate-700">Manana entre semana</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={ruleForm.morningRequiredWeekday}
              onChange={(e) => (ruleForm.morningRequiredWeekday = Number(e.target.value))}
            />
          </label>
          <label className="text-sm">
            <span className="text-xs font-semibold text-slate-700">Manana finde</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={ruleForm.morningRequiredWeekend}
              onChange={(e) => (ruleForm.morningRequiredWeekend = Number(e.target.value))}
            />
          </label>
          <label className="text-sm">
            <span className="text-xs font-semibold text-slate-700">Tarde diario</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={ruleForm.afternoonRequiredDaily}
              onChange={(e) => (ruleForm.afternoonRequiredDaily = Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-3">
            <input
              type="checkbox"
              checked={ruleForm.enforceTwoConsecutiveDaysOff}
              onChange={(e) => (ruleForm.enforceTwoConsecutiveDaysOff = e.target.checked)}
            />
            2 dias consecutivos libres (warning si no se cumple)
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-3">
            <input
              type="checkbox"
              checked={ruleForm.enforceOneWeekendOffPer30d}
              onChange={(e) => (ruleForm.enforceOneWeekendOffPer30d = e.target.checked)}
            />
            1 finde libre cada 30 dias (warning)
          </label>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={!hotelId}
            >
              Guardar reglas
            </button>
          </div>
        </form>
      </div>

      {preview && (
        <div className="space-y-3 rounded border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Propuesta</h3>
          {preview.warnings?.length ? (
            <ul className="list-disc px-4 text-xs text-amber-700">
              {preview.warnings.map((w: any, idx: number) => (
                <li key={idx}>{w.message ?? w.code}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-600">Sin warnings</p>
          )}
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-2 py-1 text-left font-semibold">Fecha</th>
                  <th className="px-2 py-1 text-left font-semibold">Turno</th>
                  <th className="px-2 py-1 text-left font-semibold">Asignaciones</th>
                </tr>
              </thead>
              <tbody>
                {preview.assignments?.map((a: any, idx: number) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-2 py-1">{a.shift_date}</td>
                    <td className="px-2 py-1">{a.shift_type}</td>
                    <td className="px-2 py-1">{a.staff_member_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
