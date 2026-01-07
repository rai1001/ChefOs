export type EventStatus = 'draft' | 'confirmed' | 'in_production' | 'closed' | 'cancelled'

export type Space = {
  id: string
  orgId: string
  hotelId: string
  name: string
  capacity?: number | null
  notes?: string | null
  createdAt?: string
}

export type SpaceBooking = {
  id: string
  orgId: string
  eventId: string
  spaceId: string
  startsAt: string
  endsAt: string
  groupLabel?: string | null
  note?: string | null
}

type BookingLike = {
  id?: string
  startsAt: string
  endsAt: string
}

export function detectOverlaps(bookings: BookingLike[], candidate: BookingLike): boolean {
  const candStart = new Date(candidate.startsAt).getTime()
  const candEnd = new Date(candidate.endsAt).getTime()
  if (!Number.isFinite(candStart) || !Number.isFinite(candEnd) || candEnd <= candStart) {
    return false
  }

  return bookings.some((b) => {
    if (b.id && candidate.id && b.id === candidate.id) return false
    const start = new Date(b.startsAt).getTime()
    const end = new Date(b.endsAt).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false
    return !(end <= candStart || start >= candEnd)
  })
}
