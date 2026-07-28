import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@osac/ui-components/test-utils/TestProviders';

import { AdminCatalogRoutes } from './AdminCatalogRoutes';

vi.mock('@osac/ui-components/pages/admin/CatalogManagementListPage', () => ({
  default: () => <div>list-page</div>,
}));
vi.mock('@osac/ui-components/pages/admin/cluster/ClusterCatalogItemDetailPage', () => ({
  default: () => <div>cluster-detail-page</div>,
}));
vi.mock(
  '@osac/ui-components/pages/admin/compute-instance/ComputeInstanceCatalogItemDetailPage',
  () => ({
    default: () => <div>compute-instance-detail-page</div>,
  }),
);
vi.mock(
  '@osac/ui-components/pages/admin/baremetal-instance/BareMetalInstanceCatalogItemDetailPage',
  () => ({
    default: () => <div>baremetal-instance-detail-page</div>,
  }),
);

// Mirrors AppShell.tsx's real mount point (`/admin/catalog/*`) — required so the component's
// internal `<Navigate to="/admin/catalog" />` redirect resolves to a route that actually exists.
const renderAt = (path: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/catalog/*" element={<AdminCatalogRoutes />} />
    </Routes>,
    { routerEntries: [`/admin/catalog${path}`] },
  );

describe('AdminCatalogRoutes', () => {
  it('renders the list page at the index route', () => {
    renderAt('/');
    expect(screen.getByText('list-page')).toBeInTheDocument();
  });

  it('dispatches :type/:id to the cluster detail page for type=cluster', () => {
    renderAt('/cluster/catalog-1');
    expect(screen.getByText('cluster-detail-page')).toBeInTheDocument();
  });

  it('dispatches :type/:id to the compute-instance detail page for type=compute-instance', () => {
    renderAt('/compute-instance/catalog-1');
    expect(screen.getByText('compute-instance-detail-page')).toBeInTheDocument();
  });

  it('dispatches :type/:id to the baremetal-instance detail page for type=baremetal-instance', () => {
    renderAt('/baremetal-instance/catalog-1');
    expect(screen.getByText('baremetal-instance-detail-page')).toBeInTheDocument();
  });

  it('redirects to the list page for an unknown type', () => {
    renderAt('/unknown-type/catalog-1');
    expect(screen.getByText('list-page')).toBeInTheDocument();
  });
});
