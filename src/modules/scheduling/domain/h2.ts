export type H2ShiftType = 'mañana' | 'tarde'

export type Candidate = {
  id: string
  shiftPattern: 'mañana' | 'tarde' | 'rotativo'
  weekAssigned: number
}

export function canWorkShift(pattern: Candidate['shiftPattern'], shift: H2ShiftType) {
  if (pattern === 'rotativo') return true
  return pattern === shift
}

export function scoreCandidate(candidate: Candidate, shift: H2ShiftType) {
  let score = candidate.weekAssigned
  if (candidate.shiftPattern === shift) score -= 0.2
  if (candidate.shiftPattern === 'rotativo') score -= 0.3
  return score
}

export function buildOffPlan(staffIds: string[]) {
  // MVP: reserve two consecutive days off starting Saturday+Sunday if available
  if (staffIds.length === 0) return new Map<string, string[]>()
  const offMap = new Map<string, string[]>()
  staffIds.forEach((id) => {
    offMap.set(id, ['2026-01-10', '2026-01-11'])
  })
  return offMap
}
