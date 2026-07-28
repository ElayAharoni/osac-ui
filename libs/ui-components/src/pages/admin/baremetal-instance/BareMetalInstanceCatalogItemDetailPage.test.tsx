import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BareMetalInstanceCatalogItem } from '@osac/types';
import type { BareMetalInstanceCatalogItem as PrivateBareMetalInstanceCatalogItem } from '@osac/types/private';

import { SessionProvider } from '../../../hooks/use-session';
import { mockQueryResult } from '../../../test-utils/query';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('../../../api/v1/baremetal-instance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/v1/baremetal-instance')>();
  return {
    ...actual,
    useBareMetalInstanceCatalogItem: vi.fn(),
  };
});
vi.mock('../../../api/v1/private/baremetal-instance-catalog-item', () => ({
  usePrivateBareMetalInstanceCatalogItem: vi.fn(),
}));

const { useBareMetalInstanceCatalogItem } = await import('../../../api/v1/baremetal-instance');
const { usePrivateBareMetalInstanceCatalogItem } =
  await import('../../../api/v1/private/baremetal-instance-catalog-item');

const BareMetalInstanceCatalogItemDetailPage = (
  await import('./BareMetalInstanceCatalogItemDetailPage')
).default;

const publicItem: BareMetalInstanceCatalogItem = {
  $typeName: 'osac.public.v1.BareMetalInstanceCatalogItem',
  id: 'catalog-1',
  title: 'Bare Metal Worker',
  description: '',
  template: 'tpl-bm-worker',
  published: true,
  fieldDefinitions: [],
};

const privateItem: PrivateBareMetalInstanceCatalogItem = {
  id: publicItem.id,
  title: publicItem.title,
  description: publicItem.description,
  template: publicItem.template,
  published: publicItem.published,
  fieldDefinitions: [],
  $typeName: 'osac.private.v1.BareMetalInstanceCatalogItem',
  tenant: 'acme-corp',
};

const renderPage = (role: 'providerAdmin' | 'tenantAdmin') =>
  renderWithProviders(
    <SessionProvider role={role} username="test-user">
      <Routes>
        <Route
          path="/admin/catalog/baremetal-instance/:id"
          element={<BareMetalInstanceCatalogItemDetailPage />}
        />
      </Routes>
    </SessionProvider>,
    { routerEntries: ['/admin/catalog/baremetal-instance/catalog-1'] },
  );

describe('BareMetalInstanceCatalogItemDetailPage', () => {
  beforeEach(() => {
    vi.mocked(useBareMetalInstanceCatalogItem).mockReturnValue(
      mockQueryResult({ data: publicItem }) as ReturnType<typeof useBareMetalInstanceCatalogItem>,
    );
    vi.mocked(usePrivateBareMetalInstanceCatalogItem).mockReturnValue(
      mockQueryResult({ data: privateItem }) as ReturnType<
        typeof usePrivateBareMetalInstanceCatalogItem
      >,
    );
  });

  it('renders the public catalog item for tenantAdmin', async () => {
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Bare Metal Worker' })).toBeInTheDocument();
    });
    expect(usePrivateBareMetalInstanceCatalogItem).toHaveBeenCalledWith(undefined);
    expect(useBareMetalInstanceCatalogItem).toHaveBeenCalledWith('catalog-1');
  });

  it('renders the private catalog item for providerAdmin', async () => {
    renderPage('providerAdmin');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Bare Metal Worker' })).toBeInTheDocument();
    });
    expect(usePrivateBareMetalInstanceCatalogItem).toHaveBeenCalledWith('catalog-1');
    expect(useBareMetalInstanceCatalogItem).toHaveBeenCalledWith(undefined);
  });

  it('shows a not-found state when the item does not exist', async () => {
    vi.mocked(useBareMetalInstanceCatalogItem).mockReturnValue(
      mockQueryResult({ data: undefined }) as ReturnType<typeof useBareMetalInstanceCatalogItem>,
    );
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByText('Catalog item not found')).toBeInTheDocument();
    });
  });
});
