import { MemoryRouter } from 'react-router-dom';
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
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@osac/ui-components/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AdminCatalogRoutes />
    </MemoryRouter>,
  );

describe('AdminCatalogRoutes', () => {
  it('renders the cluster create page for :type = cluster', () => {
    renderAt('/cluster/create');

    expect(screen.getByText('Cluster create page')).toBeInTheDocument();
  });

  it('renders the compute instance create page for :type = compute-instance', () => {
    renderAt('/compute-instance/create');

    expect(screen.getByText('Compute instance create page')).toBeInTheDocument();
  });

  it('renders the bare metal create page for :type = baremetal-instance', () => {
    renderAt('/baremetal-instance/create');

    expect(screen.getByText('Bare metal create page')).toBeInTheDocument();
  });
});
