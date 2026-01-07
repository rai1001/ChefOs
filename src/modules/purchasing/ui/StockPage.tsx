import { useState } from 'react'
import { useSupabaseSession } from '@/modules/auth/data/session'
import { useHotels, useIngredients } from '../data/orders'

export function StockPage() {
  const { session, loading, error } = useSupabaseSession()
  const hotels = useHotels()
  const [hotelId, setHotelId] = useState<string>('')
  const ingredients = useIngredients(hotelId || undefined)

  if (loading) return <p className="p-4 text-sm text-slate-600">Cargando sesión...</p>
  if (!session || error)
    return (
      <div className="rounded border border-slate-200 bg-white p-4">
        <p className="text-sm text-red-600">Inicia sesión para ver stock.</p>
      </div>
    )

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Inventario</p>
          <h1 className="text-2xl font-semibold text-slate-900">Stock por hotel</h1>
        </div>
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={hotelId}
          onChange={(e) => setHotelId(e.target.value)}
        >
          <option value="">Selecciona hotel</option>
          {hotels.data?.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Ingredientes</h2>
          {ingredients.isLoading && <span className="text-xs text-slate-500">Cargando...</span>}
        </div>
        <div className="divide-y divide-slate-100">
          {ingredients.data?.length ? (
            ingredients.data.map((ing) => (
              <div key={ing.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{ing.name}</p>
                  <p className="text-xs text-slate-600">Unidad: {ing.baseUnit}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{ing.stock ?? 0}</p>
              </div>
            ))
          ) : (
            <p className="px-4 py-6 text-sm text-slate-600">Selecciona hotel para ver stock.</p>
          )}
        </div>
      </div>
    </div>
  )
}
