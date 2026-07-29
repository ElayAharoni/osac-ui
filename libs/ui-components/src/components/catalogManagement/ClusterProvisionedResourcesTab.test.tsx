import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Cluster } from '@osac/types';

import { mockQueryResult } from '../../test-utils/query';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('@osac/ui-components/api/v1/cluster', () => ({
  useClustersForCatalogItem: vi.fn(),
}));

const { useClustersForCatalogItem } = await import('@osac/ui-components/api/v1/cluster');

const ClusterProvisionedResourcesTab = (await import('./ClusterProvisionedResourcesTab')).default;

const cluster = (id: string): Cluster =>
  ({
    id,
    metadata: { name: `cluster-${id}` },
    status: {},
  }) as Cluster;

describe('ClusterProvisionedResourcesTab', () => {
  beforeEach(() => {
    vi.mocked(useClustersForCatalogItem).mockReturnValue(
      mockQueryResult({ data: { items: [], total: 0 } }) as ReturnType<
        typeof useClustersForCatalogItem
      >,
    );
  });

  it('renders cluster rows linking to the cluster detail page', () => {
    vi.mocked(useClustersForCatalogItem).mockReturnValue(
      mockQueryResult({
        data: { items: [cluster('cluster-1')], total: 1 },
      }) as ReturnType<typeof useClustersForCatalogItem>,
    );

    renderWithProviders(<ClusterProvisionedResourcesTab catalogItemId="catalog-1" />);

    const link = screen.getByRole('link', { name: 'cluster-cluster-1' });
    expect(link).toHaveAttribute('href', '/clusters/cluster-1');
  });

  it('queries only clusters scoped to the given catalog item id', () => {
    renderWithProviders(<ClusterProvisionedResourcesTab catalogItemId="catalog-1" />);

    expect(useClustersForCatalogItem).toHaveBeenCalledWith(
      'catalog-1',
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
  });

  it('advances to the next page and re-queries with the updated offset', async () => {
    vi.mocked(useClustersForCatalogItem).mockReturnValue(
      mockQueryResult({
        data: { items: [cluster('cluster-1')], total: 42 },
      }) as ReturnType<typeof useClustersForCatalogItem>,
    );

    const { user } = renderWithProviders(
      <ClusterProvisionedResourcesTab catalogItemId="catalog-1" />,
    );

    await user.click(screen.getByRole('button', { name: /go to next page/i }));

    expect(useClustersForCatalogItem).toHaveBeenLastCalledWith(
      'catalog-1',
      expect.objectContaining({ limit: 10, offset: 10 }),
    );
  });

  it('resets to page 1 when the catalog item id changes', async () => {
    vi.mocked(useClustersForCatalogItem).mockReturnValue(
      mockQueryResult({
        data: { items: [cluster('cluster-1')], total: 42 },
      }) as ReturnType<typeof useClustersForCatalogItem>,
    );

    const { user, rerender } = renderWithProviders(
      <ClusterProvisionedResourcesTab catalogItemId="catalog-1" />,
    );

    await user.click(screen.getByRole('button', { name: /go to next page/i }));
    expect(useClustersForCatalogItem).toHaveBeenLastCalledWith(
      'catalog-1',
      expect.objectContaining({ offset: 10 }),
    );

    rerender(<ClusterProvisionedResourcesTab catalogItemId="catalog-2" />);

    expect(useClustersForCatalogItem).toHaveBeenLastCalledWith(
      'catalog-2',
      expect.objectContaining({ offset: 0 }),
    );
  });
});
