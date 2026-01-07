import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSupabaseSession } from '@/modules/auth/data/session'
import { useHotels, usePurchaseOrders } from '../data/orders'
import type { PurchaseOrderStatus } from '../domain/purchaseOrder'

export function PurchaseOrdersPage() {
  const { session, loading, error } = useSupabaseSession()
  const hotels = useHotels()
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('')
  const [hotelId, setHotelId] = useState<string>('')
  const orders = usePurchaseOrders({
    status: status || undefined,
    hotelId: hotelId || undefined,
  })

  const hotelMap = useMemo(
    () =>
      (hotels.data ?? []).reduce<Record<string, string>>((acc, h) => {
        acc[h.id] = h.name
        return acc
      }, {}),
    [hotels.data],
  )

  if (loading) return <p className="p-4 text-sm text-slate-600">Cargando sesión...</p>
  if (!session || error)
    return (
      <div className="rounded border border-slate-200 bg-white p-4">
        <p className="text-sm text-red-600">Inicia sesión para ver pedidos.</p>
      </div>
    )

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Compras</p>
          <h1 className="text-2xl font-semibold text-slate-900">Pedidos de compra</h1>
          <p className="text-sm text-slate-600">Filtra por estado u hotel.</p>
        </div>
        <Link
          to="/purchasing/orders/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
        >
          Nuevo pedido
        </Link>
      </header>

      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as PurchaseOrderStatus | '')}
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="confirmed">Confirmado</option>
          <option value="received">Recibido</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={hotelId}
          onChange={(e) => setHotelId(e.target.value)}
        >
          <option value="">Todos los hoteles</option>
          {(hotels.data ?? []).map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Listado</h2>
          {orders.isLoading && <span className="text-xs text-slate-500">Cargando...</span>}
        </div>
        <div className="divide-y divide-slate-100">
          {orders.data?.length ? (
            orders.data.map((po) => (
              <Link
                key={po.id}
                to={`/purchasing/orders/${po.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{po.orderNumber}</p>
                  <p className="text-xs text-slate-600">
                    Hotel: {hotelMap[po.hotelId] ?? 'N/D'} · Estado: {po.status} · €
                    {po.totalEstimated.toFixed(2)}
                  </p>
                </div>
                <span className="text-xs text-brand-700">Ver</span>
              </Link>
            ))
          ) : (
            <p className="px-4 py-6 text-sm text-slate-600">No hay pedidos.</p>
          )}
        </div>
      </div>
    </div>
  )
}
