import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSupabaseSession } from '@/modules/auth/data/session'
import { detectOverlaps } from '../domain/event'
import { useBookingsByHotel, useCreateSpace, useHotels, useSpaces } from '../data/events'

function toISO(dateStr: string, daysToAdd = 0) {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  if (!Number.isFinite(d.getTime())) return undefined
  d.setDate(d.getDate() + daysToAdd)
  return d.toISOString()
}

function formatRange(start?: string, end?: string) {
  if (!start || !end) return ''
  const s = new Date(start)
  const e = new Date(end)
  return `${s.toLocaleString()} - ${e.toLocaleTimeString()}`
}

export function EventsBoardPage() {
  const today = new Date().toISOString().slice(0, 10)
  const { session, loading, error } = useSupabaseSession()
  const hotels = useHotels()
  const [hotelId, setHotelId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(today)
  const [spaceName, setSpaceName] = useState('')
  const [spaceCapacity, setSpaceCapacity] = useState('')
  const createSpace = useCreateSpace()

  useEffect(() => {
    if (!hotelId && hotels.data?.length) {
      setHotelId(hotels.data[0].id)
    }
  }, [hotelId, hotels.data])

  const rangeStart = toISO(startDate)
  const rangeEnd = toISO(startDate, 7)

  const spaces = useSpaces(hotelId || undefined)
  const bookings = useBookingsByHotel({ hotelId: hotelId || '', startsAt: rangeStart, endsAt: rangeEnd })

  const bookingsBySpace = useMemo(() => {
    const map = new Map<string, typeof bookings.data>()
    bookings.data?.forEach((b) => {
      if (!map.has(b.spaceId)) map.set(b.spaceId, [])
      map.get(b.spaceId)?.push(b)
    })
    return map
  }, [bookings.data])

  if (loading) return <p className="p-4 text-sm text-slate-600">Cargando sesi¢n...</p>
  if (!session || error)
    return (
      <div className="rounded border border-slate-200 bg-white p-4">
        <p className="text-sm text-red-600">Inicia sesi¢n para ver eventos.</p>
      </div>
    )

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Salones</p>
          <h1 className="text-2xl font-semibold text-slate-900">Ocupaci¢n por sal¢n</h1>
          <p className="text-sm text-slate-600">Rango semanal por hotel. Muestra avisos de solape.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
          >
            <option value="">Hotel</option>
            {hotels.data?.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Link
            to="/events/new"
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
          >
            Nuevo evento
          </Link>
        </div>
      </header>

      <form
        className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!hotelId || !spaceName) return
          const selectedHotel = hotels.data?.find((h) => h.id === hotelId)
          const capNumber = spaceCapacity ? Number(spaceCapacity) : null
          await createSpace.mutateAsync({
            hotelId,
            orgId: selectedHotel?.orgId ?? '',
            name: spaceName,
            capacity: Number.isFinite(capNumber) ? capNumber : null,
            notes: null,
          })
          setSpaceName('')
          setSpaceCapacity('')
        }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nuevo sal¢n</span>
        <input
          className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Nombre"
          value={spaceName}
          onChange={(e) => setSpaceName(e.target.value)}
        />
        <input
          className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Capacidad"
          value={spaceCapacity}
          onChange={(e) => setSpaceCapacity(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!hotelId || !spaceName || createSpace.isPending}
        >
          {createSpace.isPending ? 'Guardando...' : 'Crear sal¢n'}
        </button>
        {createSpace.isError && (
          <span className="text-xs text-red-600">
            {(createSpace.error as Error).message || 'No se pudo crear el sal¢n'}
          </span>
        )}
      </form>

      {bookings.isLoading && <p className="text-sm text-slate-600">Cargando reservas...</p>}

      <div className="space-y-3">
        {spaces.data?.map((space) => {
          const list = bookingsBySpace.get(space.id) ?? []
          return (
            <div key={space.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">{space.name}</h2>
                  <p className="text-xs text-slate-500">
                    Capacidad {space.capacity ?? 'n/d'} · {list.length} reservas
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {list.length ? (
                  list.map((b) => {
                    const hasOverlap = detectOverlaps(list, b)
                    return (
                      <div
                        key={b.id}
                        className="flex flex-col gap-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{b.eventTitle ?? 'Evento'}</p>
                          <p className="text-xs text-slate-600">
                            {formatRange(b.startsAt, b.endsAt)} {b.groupLabel ? `· ${b.groupLabel}` : ''}
                          </p>
                        </div>
                        {hasOverlap && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                            SOLAPE
                          </span>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-slate-600">Sin reservas en el rango.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
