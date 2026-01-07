export type ShiftType = 'desayuno' | 'bar_tarde' | 'eventos' | 'produccion' | 'libre'

export function computeMissing(requiredCount: number, assignedCount: number): number {
  const missing = requiredCount - assignedCount
  return missing > 0 ? missing : 0
}

export function validateShiftWindow(startsAt: string, endsAt: string): boolean {
  return startsAt < endsAt
}

export function getWeekDays(weekStart: string): string[] {
  const start = new Date(weekStart + 'T00:00:00Z')
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}
