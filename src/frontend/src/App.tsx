import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { Bills } from "./pages/Bills";
import { Contacts } from "./pages/Contacts";
import { Dashboard } from "./pages/Dashboard";
import { Expenses } from "./pages/Expenses";
import { Inventory } from "./pages/Inventory";
import { Invoices } from "./pages/Invoices";
import { ProfitLoss } from "./pages/ProfitLoss";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { VatTracking } from "./pages/VatTracking";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});
const invoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invoices",
  component: Invoices,
});
const billsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bills",
  component: Bills,
});
const plRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pl",
  component: ProfitLoss,
});
const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses",
  component: Expenses,
});
const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory",
  component: Inventory,
});
const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacts",
  component: Contacts,
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: Reports,
});
const vatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vat",
  component: VatTracking,
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  invoicesRoute,
  billsRoute,
  plRoute,
  expensesRoute,
  inventoryRoute,
  contactsRoute,
  reportsRoute,
  vatRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
