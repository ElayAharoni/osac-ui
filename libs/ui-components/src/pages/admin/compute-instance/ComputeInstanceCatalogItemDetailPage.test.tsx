import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';
import type { ComputeInstanceCatalogItem as PrivateComputeInstanceCatalogItem } from '@osac/types/private';

import { SessionProvider } from '../../../hooks/use-session';
import { mockQueryResult } from '../../../test-utils/query';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('../../../api/v1/compute-instance-catalog-item', () => ({
  useComputeInstanceCatalogItem: vi.fn(),
}));
vi.mock('../../../api/v1/private/compute-instance-catalog-item', () => ({
  usePrivateComputeInstanceCatalogItem: vi.fn(),
}));
vi.mock('../../../api/v1/compute-instance-templates', () => ({
  useComputeInstanceTemplate: vi.fn(),
}));

const { useComputeInstanceCatalogItem } =
  await import('../../../api/v1/compute-instance-catalog-item');
const { usePrivateComputeInstanceCatalogItem } =
  await import('../../../api/v1/private/compute-instance-catalog-item');
const { useComputeInstanceTemplate } = await import('../../../api/v1/compute-instance-templates');

const ComputeInstanceCatalogItemDetailPage = (
  await import('./ComputeInstanceCatalogItemDetailPage')
).default;

const publicItem: ComputeInstanceCatalogItem = {
  $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
  id: 'catalog-1',
  title: 'RHEL 9 VM',
  description: '',
  template: 'tpl-rhel-9',
  published: true,
  fieldDefinitions: [],
};

const privateItem: PrivateComputeInstanceCatalogItem = {
  id: publicItem.id,
  title: publicItem.title,
  description: publicItem.description,
  template: publicItem.template,
  published: publicItem.published,
  fieldDefinitions: [],
  $typeName: 'osac.private.v1.ComputeInstanceCatalogItem',
  tenant: 'acme-corp',
};

const renderPage = (role: 'providerAdmin' | 'tenantAdmin') =>
  renderWithProviders(
    <SessionProvider role={role} username="test-user">
      <Routes>
        <Route
          path="/admin/catalog/compute-instance/:id"
          element={<ComputeInstanceCatalogItemDetailPage />}
        />
      </Routes>
    </SessionProvider>,
    { routerEntries: ['/admin/catalog/compute-instance/catalog-1'] },
  );

describe('ComputeInstanceCatalogItemDetailPage', () => {
  beforeEach(() => {
    vi.mocked(useComputeInstanceCatalogItem).mockReturnValue(
      mockQueryResult({ data: publicItem }) as ReturnType<typeof useComputeInstanceCatalogItem>,
    );
    vi.mocked(usePrivateComputeInstanceCatalogItem).mockReturnValue(
      mockQueryResult({ data: privateItem }) as ReturnType<
        typeof usePrivateComputeInstanceCatalogItem
      >,
    );
    vi.mocked(useComputeInstanceTemplate).mockReturnValue(
      mockQueryResult({ data: undefined }) as ReturnType<typeof useComputeInstanceTemplate>,
    );
  });

  it('renders the public catalog item for tenantAdmin', async () => {
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'RHEL 9 VM' })).toBeInTheDocument();
    });
    expect(usePrivateComputeInstanceCatalogItem).toHaveBeenCalledWith(undefined);
    expect(useComputeInstanceCatalogItem).toHaveBeenCalledWith('catalog-1');
  });

  it('resolves and displays the template title when available', async () => {
    vi.mocked(useComputeInstanceTemplate).mockReturnValue(
      mockQueryResult({
        data: {
          $typeName: 'osac.public.v1.ComputeInstanceTemplate',
          id: 'tpl-rhel-9',
          title: 'RHEL 9 Template',
          description: '',
          parameters: [],
        },
      }) as ReturnType<typeof useComputeInstanceTemplate>,
    );
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByText('RHEL 9 Template')).toBeInTheDocument();
    });
    expect(useComputeInstanceTemplate).toHaveBeenCalledWith('tpl-rhel-9');
  });

  it('renders the private catalog item for providerAdmin', async () => {
    renderPage('providerAdmin');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'RHEL 9 VM' })).toBeInTheDocument();
    });
    expect(usePrivateComputeInstanceCatalogItem).toHaveBeenCalledWith('catalog-1');
    expect(useComputeInstanceCatalogItem).toHaveBeenCalledWith(undefined);
  });

  it('shows a not-found state when the item does not exist', async () => {
    vi.mocked(useComputeInstanceCatalogItem).mockReturnValue(
      mockQueryResult({ data: undefined }) as ReturnType<typeof useComputeInstanceCatalogItem>,
    );
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByText('Catalog item not found')).toBeInTheDocument();
    });
  });
});
