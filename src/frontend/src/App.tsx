import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from './hooks/useQueries';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import InvoiceFormPage from './pages/InvoiceFormPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import PublicInvoiceViewPage from './pages/PublicInvoiceViewPage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();
  const [name, setName] = useState('');

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleSave = () => {
    if (name.trim()) {
      saveProfile({ name: name.trim() });
    }
  };

  return (
    <Dialog open={showProfileSetup}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome! Set up your profile</DialogTitle>
          <DialogDescription>
            Please enter your name to get started with creating invoices.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!name.trim() || isPending}>
            {isPending ? 'Saving...' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function App() {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <ProfileSetupModal />
        <Outlet />
      </>
    ),
  });

  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'layout',
    component: LayoutWrapper,
  });

  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: DashboardPage,
  });

  const dashboardRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/dashboard',
    component: DashboardPage,
  });

  const createInvoiceRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/create',
    component: InvoiceFormPage,
  });

  const editInvoiceRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/edit/$id',
    component: InvoiceFormPage,
  });

  const invoiceDetailRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/invoice/$id',
    component: InvoiceDetailPage,
  });

  const publicInvoiceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/public/invoice/$id',
    component: PublicInvoiceViewPage,
  });

  const routeTree = rootRoute.addChildren([
    layoutRoute.addChildren([
      indexRoute,
      dashboardRoute,
      createInvoiceRoute,
      editInvoiceRoute,
      invoiceDetailRoute,
    ]),
    publicInvoiceRoute,
  ]);

  const router = createRouter({ routeTree });

  return <RouterProvider router={router} />;
}

export default App;
