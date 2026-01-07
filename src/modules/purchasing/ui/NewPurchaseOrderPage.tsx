import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useSupabaseSession } from '@/modules/auth/data/session'
import { useHotels, useSuppliersLite, useCreatePurchaseOrder } from '../data/orders'

const schema = z.object({
  hotelId: z.string().min(1, 'Hotel obligatorio'),
  supplierId: z.string().min(1, 'Proveedor obligatorio'),
  orderNumber: z.string().min(1, 'Número de pedido obligatorio'),
  notes: z.string().optional(),
})

type Form = z.infer<typeof schema>

export function NewPurchaseOrderPage() {
  const { session, loading, error } = useSupabaseSession()
  const hotels = useHotels()
  const suppliers = useSuppliersLite()
  const createOrder = useCreatePurchaseOrder()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      orderNumber: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    },
  })

  const onSubmit = async (values: Form) => {
    const orgId = hotels.data?.find((h) => h.id === values.hotelId)?.orgId
    const po = await createOrder.mutateAsync({ ...values, orgId: orgId ?? '' })
    navigate(`/purchasing/orders/${po.id}`)
  }

  if (loading) return <p className="p-4 text-sm text-slate-600">Cargando sesión...</p>
  if (!session || error)
    return (
      <div className="rounded border border-slate-200 bg-white p-4">
        <p className="text-sm text-red-600">Inicia sesión para crear pedidos.</p>
      </div>
    )

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Compras</p>
        <h1 className="text-2xl font-semibold text-slate-900">Nuevo pedido</h1>
        <p className="text-sm text-slate-600">Selecciona hotel y proveedor, y asigna un número.</p>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-800">Hotel</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              {...register('hotelId')}
            >
              <option value="">Selecciona hotel</option>
              {hotels.data?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            {errors.hotelId && <p className="text-xs text-red-600">{errors.hotelId.message}</p>}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-800">Proveedor</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              {...register('supplierId')}
            >
              <option value="">Selecciona proveedor</option>
              {suppliers.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supplierId && <p className="text-xs text-red-600">{errors.supplierId.message}</p>}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-800">Número de pedido</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="PO-20240101-001"
              {...register('orderNumber')}
            />
            {errors.orderNumber && (
              <p className="text-xs text-red-600">{errors.orderNumber.message}</p>
            )}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-800">Notas</span>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              rows={3}
              placeholder="Detalle opcional"
              {...register('notes')}
            />
          </label>

          {createOrder.isError && (
            <p className="text-sm text-red-600">
              {(createOrder.error as Error).message || 'Error al crear el pedido.'}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Creando...' : 'Crear pedido'}
          </button>
        </form>
      </div>
    </div>
  )
}
