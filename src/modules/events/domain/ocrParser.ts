export type OcrSection = { title: string; items: string[] }
export type OcrDetectedService = {
  serviceType: 'desayuno' | 'coffee_break' | 'comida' | 'merienda' | 'cena' | 'coctel' | 'otros'
  startsAtGuess?: string | null
  paxGuess?: number | null
  formatGuess?: 'sentado' | 'de_pie'
  sections: OcrSection[]
}

export type OcrDraft = {
  rawText: string
  warnings: string[]
  detectedServices: OcrDetectedService[]
}

function detectServiceType(text: string): OcrDetectedService['serviceType'] {
  const lower = text.toLowerCase()
  if (lower.includes('desayuno')) return 'desayuno'
  if (lower.includes('coffee')) return 'coffee_break'
  if (lower.includes('almuerzo') || lower.includes('comida')) return 'comida'
  if (lower.includes('merienda')) return 'merienda'
  if (lower.includes('cena')) return 'cena'
  if (lower.includes('coctel') || lower.includes('cóctel')) return 'coctel'
  return 'otros'
}

function detectPax(text: string): number | null {
  const withKeyword = text.match(/(\d{2,4})\s*(pax|personas)/i)
  if (withKeyword) {
    const n = Number(withKeyword[1])
    return Number.isFinite(n) ? n : null
  }
  const matches = [...text.matchAll(/(\d{2,4})(?![:.]\d{2})/g)]
  const candidate = matches.find((m) => m[1])
  if (candidate) {
    const n = Number(candidate[1])
    return Number.isFinite(n) ? n : null
  }
  return null
}

function detectStart(text: string): string | null {
  const match = text.match(/\b(\d{1,2}[:.]\d{2})\b/)
  return match ? match[1].replace('.', ':') : null
}

function detectFormat(text: string): 'sentado' | 'de_pie' {
  const lower = text.toLowerCase()
  if (lower.includes('de pie') || lower.includes('coctel')) return 'de_pie'
  return 'sentado'
}

export function parseOcrText(text: string): OcrDraft {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const sections: OcrSection[] = []
  let current: OcrSection = { title: 'General', items: [] }
  lines.forEach((line) => {
    const isServiceHeader =
      /(desayuno|cena|comida|coffee|merienda|coctel)/i.test(line) && /pax/i.test(line)
    if (isServiceHeader) return
    const isSection = /[:]+$/.test(line) || line === line.toUpperCase()
    if (isSection) {
      if (current.items.length || current.title !== 'General') sections.push(current)
      current = { title: line.replace(/:$/, '').trim() || 'Seccion', items: [] }
    } else {
      current.items.push(line)
    }
  })
  if (current.items.length || sections.length === 0) sections.push(current)

  const serviceText = lines.join(' ')
  const detected: OcrDetectedService = {
    serviceType: detectServiceType(serviceText),
    paxGuess: detectPax(serviceText),
    startsAtGuess: detectStart(serviceText),
    formatGuess: detectFormat(serviceText),
    sections,
  }

  return {
    rawText: text,
    warnings: [],
    detectedServices: [detected],
  }
}
