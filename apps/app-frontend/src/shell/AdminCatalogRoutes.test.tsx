import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminCatalogRoutes } from './AdminCatalogRoutes';

vi.mock('@osac/ui-components/pages/admin/cluster/ClusterCatalogItemCreatePage', () => ({
  default: () => <div>Cluster create page</div>,
}));
vi.mock(
  '@osac/ui-components/pages/admin/compute-instance/ComputeInstanceCatalogItemCreatePage',
  () => ({
    default: () => <div>Compute instance create page</div>,
  }),
);
vi.mock(
  '@osac/ui-components/pages/admin/baremetal-instance/BareMetalInstanceCatalogItemCreatePage',
  () => ({
    default: () => <div>Bare metal create page</div>,
  }),
);
vi.mock('@osac/ui-components/components/Page/ListPage', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div>Catalog management list page{children}</div>
  ),
}));
vi.mock('@osac/ui-components/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mounted at /admin/catalog/* to match the real route registered in AppShell.tsx, so
// AdminCatalogRoutes' internal <Navigate to="/admin/catalog" /> fallback resolves correctly.
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/catalog/*" element={<AdminCatalogRoutes />} />
      </Routes>
    </MemoryRouter>,
  );

describe('AdminCatalogRoutes', () => {
  it('renders the cluster create page for :type = cluster', () => {
    renderAt('/admin/catalog/cluster/create');

    expect(screen.getByText('Cluster create page')).toBeInTheDocument();
  });

  it('renders the compute instance create page for :type = compute-instance', () => {
    renderAt('/admin/catalog/compute-instance/create');

    expect(screen.getByText('Compute instance create page')).toBeInTheDocument();
  });

  it('renders the bare metal create page for :type = baremetal-instance', () => {
    renderAt('/admin/catalog/baremetal-instance/create');

    expect(screen.getByText('Bare metal create page')).toBeInTheDocument();
  });

  it('redirects to the list page for an unrecognized :type', () => {
    renderAt('/admin/catalog/not-a-real-type/create');

    expect(screen.getByText('Catalog management list page')).toBeInTheDocument();
    expect(screen.queryByText('Cluster create page')).not.toBeInTheDocument();
  });
});
