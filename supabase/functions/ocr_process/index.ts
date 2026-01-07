// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const ocrProvider = Deno.env.get('OCR_PROVIDER') ?? 'mock'

type OcrDraft = {
  rawText: string
  warnings: string[]
  detectedServices: Array<{
    service_type: string
    starts_at_guess?: string | null
    pax_guess?: number | null
    format_guess?: string | null
    sections: Array<{ title: string; items: string[] }>
  }>
}

function supabaseForUser(req: Request) {
  const authHeader = req.headers.get('Authorization') || ''
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
}

function supabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceRole)
}

function parseOcrText(text: string): OcrDraft {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const sections: { title: string; items: string[] }[] = []
  let current = { title: 'General', items: [] as string[] }
  for (const line of lines) {
    const isSection = /[:]+$/.test(line) || line === line.toUpperCase()
    if (isSection) {
      if (current.items.length || current.title !== 'General') sections.push(current)
      current = { title: line.replace(/:$/, '') || 'Seccion', items: [] }
    } else {
      current.items.push(line)
    }
  }
  if (current.items.length || sections.length === 0) sections.push(current)

  const lower = text.toLowerCase()
  const service_type = lower.includes('desayuno')
    ? 'desayuno'
    : lower.includes('coffee')
      ? 'coffee_break'
      : lower.includes('cena')
        ? 'cena'
        : lower.includes('comida') || lower.includes('almuerzo')
          ? 'comida'
          : lower.includes('merienda')
            ? 'merienda'
            : lower.includes('coctel') || lower.includes('cóctel')
              ? 'coctel'
              : 'otros'
  const paxMatch = text.match(/(\d{2,4})\s*(pax|personas)?/i)
  const pax_guess = paxMatch ? Number(paxMatch[1]) : null
  const timeMatch = text.match(/\b(\d{1,2}[:.]\d{2})\b/)
  const starts_at_guess = timeMatch ? timeMatch[1].replace('.', ':') : null
  const format_guess = lower.includes('de pie') || lower.includes('coctel') ? 'de_pie' : 'sentado'

  return {
    rawText: text,
    warnings: [],
    detectedServices: [
      {
        service_type,
        starts_at_guess,
        pax_guess,
        format_guess,
        sections,
      },
    ],
  }
}

async function handleEnqueue(req: Request) {
  const client = supabaseForUser(req)
  const body = (await req.json().catch(() => ({}))) as { attachmentId?: string }
  if (!body.attachmentId) {
    return new Response(JSON.stringify({ error: 'attachmentId requerido' }), { status: 400 })
  }
  const { data: attachment, error: attErr } = await client
    .from('event_attachments')
    .select('id, org_id')
    .eq('id', body.attachmentId)
    .single()
  if (attErr || !attachment) {
    return new Response(JSON.stringify({ error: attErr?.message || 'No attachment' }), { status: 400 })
  }

  const { data: job, error: jobErr } = await client
    .from('ocr_jobs')
    .insert({
      org_id: attachment.org_id,
      attachment_id: attachment.id,
      status: 'queued',
      provider: ocrProvider,
    })
    .select('id')
    .single()
  if (jobErr) return new Response(JSON.stringify({ error: jobErr.message }), { status: 400 })
  return new Response(JSON.stringify({ jobId: job.id }), { headers: { 'Content-Type': 'application/json' } })
}

async function handleRun(req: Request) {
  const client = supabaseForUser(req)
  const body = (await req.json().catch(() => ({}))) as { jobId?: string }
  if (!body.jobId) return new Response(JSON.stringify({ error: 'jobId requerido' }), { status: 400 })

  const { data: job, error: jobErr } = await client
    .from('ocr_jobs')
    .select('id, status, org_id, attachment_id')
    .eq('id', body.jobId)
    .single()
  if (jobErr || !job) return new Response(JSON.stringify({ error: jobErr?.message || 'Job no encontrado' }), { status: 404 })
  if (job.status === 'done' || job.status === 'failed') {
    return new Response(JSON.stringify({ status: job.status }), { headers: { 'Content-Type': 'application/json' } })
  }

  const toProcessing = await client.from('ocr_jobs').update({ status: 'processing' }).eq('id', body.jobId)
  if (toProcessing.error) return new Response(JSON.stringify({ error: toProcessing.error.message }), { status: 400 })

  try {
    // En mock no descargamos archivo; usamos un texto base
    let extractedText =
      'DESAYUNO 08:00 60 pax\nBEBIDAS:\nCafe\nZumo\n\nCENA 21:00 50 pax\nENTRANTES:\nEnsalada\nPRINCIPAL:\nPasta\n'
    if (ocrProvider !== 'mock') {
      // Si en el futuro se añade proveedor real, descargar el archivo y enviarlo al proveedor.
      const admin = supabaseAdmin()
      const { data: attachment } = await admin
        .from('event_attachments')
        .select('storage_bucket, storage_path')
        .eq('id', job.attachment_id)
        .single()
      if (attachment) {
        const download = await admin.storage.from(attachment.storage_bucket).download(attachment.storage_path)
        if (!download.error) {
          const buffer = await download.data.arrayBuffer()
          extractedText = new TextDecoder().decode(buffer).slice(0, 5000)
        }
      }
    }
    const draft = parseOcrText(extractedText)
    const { error: updErr } = await client
      .from('ocr_jobs')
      .update({
        status: 'done',
        extracted_text: extractedText,
        draft_json: draft as any,
        error: null,
      })
      .eq('id', body.jobId)
    if (updErr) throw updErr
    return new Response(JSON.stringify({ status: 'done' }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    await client.from('ocr_jobs').update({ status: 'failed', error: String(err?.message || err) }).eq('id', body.jobId)
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 })
  }
}

serve(async (req) => {
  const url = new URL(req.url)
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Faltan variables SUPABASE_URL o ANON_KEY' }), { status: 500 })
  }

  if (req.method === 'POST' && url.pathname.endsWith('/enqueue')) {
    return handleEnqueue(req)
  }
  if (req.method === 'POST' && url.pathname.endsWith('/run')) {
    return handleRun(req)
  }
  return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
})
