import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabaseClient'
import type { Product } from '../domain/recipes'

function mapProduct(row: any): Product & { category?: string | null; active: boolean; createdAt?: string } {
  return {
    id: row.id,
    name: row.name,
    baseUnit: row.base_unit,
    category: row.category,
    active: row.active,
    createdAt: row.created_at,
  }
}

export async function listProducts(orgId?: string): Promise<(Product & { category?: string | null; active: boolean })[]> {
  const supabase = getSupabaseClient()
  let query = supabase.from('products').select('*').order('created_at', { ascending: false })
  if (orgId) query = query.eq('org_id', orgId)
  const { data, error } = await query
  if (error) throw error
  return data?.map(mapProduct) ?? []
}

export async function createProduct(params: {
  orgId: string
  name: string
  baseUnit: 'kg' | 'ud'
  category?: string | null
}): Promise<Product> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('products')
    .insert({
      org_id: params.orgId,
      name: params.name,
      base_unit: params.baseUnit,
      category: params.category ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapProduct(data)
}

export async function updateProduct(
  id: string,
  payload: Partial<{ name: string; baseUnit: 'kg' | 'ud'; category?: string | null; active: boolean }>,
): Promise<Product> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('products')
    .update({
      name: payload.name,
      base_unit: payload.baseUnit,
      category: payload.category ?? null,
      active: payload.active,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapProduct(data)
}

export function useProducts(orgId: string | undefined) {
  return useQuery({
    queryKey: ['products', orgId],
    queryFn: () => listProducts(orgId),
    enabled: Boolean(orgId),
  })
}

export function useCreateProduct(orgId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; baseUnit: 'kg' | 'ud'; category?: string | null }) => {
      if (!orgId) throw new Error('Falta orgId')
      return createProduct({ orgId, ...payload })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', orgId] })
    },
  })
}

export function useUpdateProduct(orgId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; baseUnit?: 'kg' | 'ud'; active?: boolean }) =>
      updateProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', orgId] })
    },
  })
}
