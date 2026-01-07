import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useSupabaseSession } from '@/modules/auth/data/session'
import { detectOverlaps } from '../domain/event'
import {
  useCreateBooking,
  useDeleteBooking,
  useEvent,
  useSpaces,
} from '../data/events'

const bookingSchema = z
  .object({
    spaceId: z.string().min(1, 'Sala obligatoria'),
    startsAt: z.string().min(1, 'Inicio obligatorio'),
    endsAt: z.string().min(1, 'Fin obligatorio'),
    groupLabel: z.string().optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startsAt).getTime()
      const end = new Date(data.endsAt).getTime()
      return Number.isFinite(start) && Number.isFinite(end) && end > start
    },
    { message: 'Fin debe ser posterior al inicio', path: ['endsAt'] },
  )

type BookingForm = z.infer<typeof bookingSchema>

function toISO(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d.toISOString() : ''
}

function formatDate(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d.toLocaleString() : value
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { session, loading, error } = useSupabaseSession()
  const eventQuery = useEvent(id)
  const spaces = useSpaces(eventQuery.data?.event.hotelId)
  const createBooking = useCreateBooking(id, eventQuery.data?.event.orgId)
  const deleteBooking = useDeleteBooking(id)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      startsAt: '',
      endsAt: '',
    },
  })

  useEffect(() => {
    if (spaces.data?.length && !watch('spaceId')) {
      reset({ ...watch(), spaceId: spaces.data[0].id })
    }
  }, [spaces.data])

  const selectedSpaceId = watch('spaceId')
  const startsAt = watch('startsAt')
  const endsAt = watch('endsAt')

  const overlapWarning = useMemo(() => {
    const list = (eventQuery.data?.bookings ?? []).filter((b) => b.spaceId === selectedSpaceId)
    if (!selectedSpaceId || !startsAt || !endsAt) return false
    return detectOverlaps(list, { startsAt, endsAt })
  }, [eventQuery.data?.bookings, selectedSpaceId, startsAt, endsAt])

  const onSubmit = async (values: BookingForm) => {
    await createBooking.mutateAsync({
      spaceId: values.spaceId,
      startsAt: toISO(values.startsAt),
      endsAt: toISO(values.endsAt),
      groupLabel: values.groupLabel ?? null,
      note: values.note ?? null,
    })
    reset({ spaceId: values.spaceId, startsAt: '', endsAt: '', groupLabel: '', note: '' })
  }

  if (loading) return <p className="p-4 text-sm text-slate-600">Cargando sesi¢n...</p>
  if (!session || error)
    return (
      <div className="rounded border border-slate-200 bg-white p-4">
        <p className="text-sm text-red-600">Inicia sesi¢n para ver eventos.</p>
      </div>
    )

  if (eventQuery.isLoading) return <p className="p-4 text-sm text-slate-600">Cargando evento...</p>
  if (eventQuery.isError)
    return (
      <p className="p-4 text-sm text-red-600">
        Error al cargar: {(eventQuery.error as Error).message}
      </p>
    )

  const event = eventQuery.data?.event
  const bookings = eventQuery.data?.bookings ?? []

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Eventos</p>
          <h1 className="text-2xl font-semibold text-slate-900">{event?.title}</h1>
          <p className="text-sm text-slate-600">
            Estado: {event?.status} · Cliente: {event?.clientName ?? 'N/D'}
          </p>
          <p className="text-xs text-slate-500">
            {event?.startsAt ? `Inicio ${formatDate(event.startsAt)}` : ''}{' '}
            {event?.endsAt ? `Fin ${formatDate(event.endsAt)}` : ''}
          </p>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Reservas de sal¢n</h2>
          <span className="text-xs text-slate-500">{bookings.length} reservas</span>
        </div>
        <div className="divide-y divide-slate-100">
          {bookings.length ? (
            bookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {b.spaceName ?? b.spaceId} · {formatDate(b.startsAt)} → {formatDate(b.endsAt)}
                  </p>
                  <p className="text-xs text-slate-600">
                    {b.groupLabel ? `${b.groupLabel} · ` : ''}
                    {b.note ?? ''}
                  </p>
                </div>
                <button
                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                  onClick={() => deleteBooking.mutate(b.id)}
                >
                  Borrar
                </button>
              </div>
            ))
          ) : (
            <p className="px-4 py-6 text-sm text-slate-600">Sin reservas.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">A¤adir reserva de sal¢n</h3>
        <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-800">Sal¢n</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...register('spaceId')}
            >
              <option value="">Selecciona sal¢n</option>
              {spaces.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.spaceId && <p className="text-xs text-red-600">{errors.spaceId.message}</p>}
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-800">Inicio</span>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...register('startsAt')}
            />
            {errors.startsAt && <p className="text-xs text-red-600">{errors.startsAt.message}</p>}
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-800">Fin</span>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...register('endsAt')}
            />
            {errors.endsAt && <p className="text-xs text-red-600">{errors.endsAt.message}</p>}
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-800">Group label (opcional)</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="A+B"
              {...register('groupLabel')}
            />
          </label>

          <label className="md:col-span-2 space-y-1">
            <span className="text-sm font-medium text-slate-800">Nota</span>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              {...register('note')}
            />
          </label>

          {overlapWarning && (
            <p className="md:col-span-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              Aviso: hay solape con otra reserva de este sal¢n.
            </p>
          )}

          {createBooking.isError && (
            <p className="md:col-span-2 text-sm text-red-600">
              {(createBooking.error as Error).message || 'Error al crear reserva.'}
            </p>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? 'Guardando...' : 'A¤adir reserva'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
