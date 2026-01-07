import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from './App'
import { LoginPage } from './modules/auth/ui/LoginPage'
import { SuppliersPage } from './modules/purchasing/ui/SuppliersPage'
import { SupplierDetailPage } from './modules/purchasing/ui/SupplierDetailPage'
import { PurchaseOrdersPage } from './modules/purchasing/ui/PurchaseOrdersPage'
import { NewPurchaseOrderPage } from './modules/purchasing/ui/NewPurchaseOrderPage'
import { PurchaseOrderDetailPage } from './modules/purchasing/ui/PurchaseOrderDetailPage'
import { StockPage } from './modules/purchasing/ui/StockPage'
import { EventsBoardPage } from './modules/events/ui/EventsBoardPage'
import { NewEventPage } from './modules/events/ui/NewEventPage'
import { EventDetailPage } from './modules/events/ui/EventDetailPage'
import { MenuTemplatesPage } from './modules/events/ui/MenuTemplatesPage'
import { MenuTemplateDetailPage } from './modules/events/ui/MenuTemplateDetailPage'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/events" replace />,
      },
      {
        path: 'events',
        element: <EventsBoardPage />,
      },
      {
        path: 'events/new',
        element: <NewEventPage />,
      },
      {
        path: 'events/:id',
        element: <EventDetailPage />,
      },
      {
        path: 'menus',
        element: <MenuTemplatesPage />,
      },
      {
        path: 'menus/:id',
        element: <MenuTemplateDetailPage />,
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
