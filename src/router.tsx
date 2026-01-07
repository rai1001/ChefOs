import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from './App'
import { LoginPage } from './modules/auth/ui/LoginPage'
import { SuppliersPage } from './modules/purchasing/ui/SuppliersPage'
import { SupplierDetailPage } from './modules/purchasing/ui/SupplierDetailPage'
import { PurchaseOrdersPage } from './modules/purchasing/ui/PurchaseOrdersPage'
import { NewPurchaseOrderPage } from './modules/purchasing/ui/NewPurchaseOrderPage'
import { PurchaseOrderDetailPage } from './modules/purchasing/ui/PurchaseOrderDetailPage'
import { StockPage } from './modules/purchasing/ui/StockPage'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/purchasing/suppliers" replace />,
      },
      {
        path: 'purchasing/suppliers',
        element: <SuppliersPage />,
      },
      {
        path: 'purchasing/suppliers/:id',
        element: <SupplierDetailPage />,
      },
      {
        path: 'purchasing/orders',
        element: <PurchaseOrdersPage />,
      },
      {
        path: 'purchasing/orders/new',
        element: <NewPurchaseOrderPage />,
      },
      {
        path: 'purchasing/orders/:id',
        element: <PurchaseOrderDetailPage />,
      },
      {
        path: 'purchasing/stock',
        element: <StockPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '*',
    element: <div className="p-6 text-center text-red-600">Sección no encontrada.</div>,
  },
])
