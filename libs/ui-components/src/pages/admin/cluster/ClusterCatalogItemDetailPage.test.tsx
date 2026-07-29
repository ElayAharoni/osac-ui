import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';
import type { ClusterCatalogItem as PrivateClusterCatalogItem } from '@osac/types/private';

import { SessionProvider } from '../../../hooks/use-session';
import { mockQueryResult } from '../../../test-utils/query';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('../../../api/v1/cluster-catalog-item', () => ({
  useClusterCatalogItem: vi.fn(),
}));
vi.mock('../../../api/v1/private/cluster-catalog-item', () => ({
  usePrivateClusterCatalogItem: vi.fn(),
}));
vi.mock('../../../api/v1/cluster-templates', () => ({
  useClusterTemplate: vi.fn(),
}));

const { useClusterCatalogItem } = await import('../../../api/v1/cluster-catalog-item');
const { usePrivateClusterCatalogItem } =
  await import('../../../api/v1/private/cluster-catalog-item');
const { useClusterTemplate } = await import('../../../api/v1/cluster-templates');

const ClusterCatalogItemDetailPage = (await import('./ClusterCatalogItemDetailPage')).default;

const publicItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-1',
  title: 'OpenShift 4 cluster',
  description: '',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [],
};

const privateItem: PrivateClusterCatalogItem = {
  id: publicItem.id,
  title: publicItem.title,
  description: publicItem.description,
  template: publicItem.template,
  published: publicItem.published,
  fieldDefinitions: [],
  $typeName: 'osac.private.v1.ClusterCatalogItem',
  tenant: 'acme-corp',
};

const renderPage = (role: 'providerAdmin' | 'tenantAdmin') =>
  renderWithProviders(
    <SessionProvider role={role} username="test-user">
      <Routes>
        <Route path="/admin/catalog/cluster/:id" element={<ClusterCatalogItemDetailPage />} />
      </Routes>
    </SessionProvider>,
    { routerEntries: ['/admin/catalog/cluster/catalog-1'] },
  );

describe('ClusterCatalogItemDetailPage', () => {
  beforeEach(() => {
    vi.mocked(useClusterCatalogItem).mockReturnValue(
      mockQueryResult({ data: publicItem }) as ReturnType<typeof useClusterCatalogItem>,
    );
    vi.mocked(usePrivateClusterCatalogItem).mockReturnValue(
      mockQueryResult({ data: privateItem }) as ReturnType<typeof usePrivateClusterCatalogItem>,
    );
    vi.mocked(useClusterTemplate).mockReturnValue(
      mockQueryResult({ data: undefined }) as ReturnType<typeof useClusterTemplate>,
    );
  });

  it('renders the public catalog item for tenantAdmin', async () => {
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'OpenShift 4 cluster' })).toBeInTheDocument();
    });
    expect(usePrivateClusterCatalogItem).toHaveBeenCalledWith(undefined);
    expect(useClusterCatalogItem).toHaveBeenCalledWith('catalog-1');
  });

  it('resolves and displays the template title when available', async () => {
    vi.mocked(useClusterTemplate).mockReturnValue(
      mockQueryResult({
        data: {
          $typeName: 'osac.public.v1.ClusterTemplate',
          id: 'tpl-openshift-4',
          title: 'OpenShift 4 Template',
          description: '',
          parameters: [],
          nodeSets: {},
        },
      }) as ReturnType<typeof useClusterTemplate>,
    );
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByText('OpenShift 4 Template')).toBeInTheDocument();
    });
    expect(useClusterTemplate).toHaveBeenCalledWith('tpl-openshift-4');
  });

  it('renders the private catalog item for providerAdmin', async () => {
    renderPage('providerAdmin');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'OpenShift 4 cluster' })).toBeInTheDocument();
    });
    expect(usePrivateClusterCatalogItem).toHaveBeenCalledWith('catalog-1');
    expect(useClusterCatalogItem).toHaveBeenCalledWith(undefined);
  });

  it('shows a loading state while the query is pending, not the real content', () => {
    vi.mocked(useClusterCatalogItem).mockReturnValue(mockQueryResult({ isLoading: true }));
    renderPage('tenantAdmin');
    expect(screen.queryByRole('heading', { name: 'OpenShift 4 cluster' })).not.toBeInTheDocument();
    expect(screen.getByText('Catalog management')).toBeInTheDocument();
  });

  it('shows a not-found state when the item does not exist', async () => {
    vi.mocked(useClusterCatalogItem).mockReturnValue(
      mockQueryResult({ data: undefined }) as ReturnType<typeof useClusterCatalogItem>,
    );
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByText('Catalog item not found')).toBeInTheDocument();
    });
  });

  it('shows an error state when the query fails', async () => {
    vi.mocked(useClusterCatalogItem).mockReturnValue(
      mockQueryResult({ isError: true, error: new Error('boom') }),
    );
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByText('Could not load catalog item')).toBeInTheDocument();
    });
  });
});
