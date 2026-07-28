import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Cluster } from '@osac/types';

import { mockQueryResult } from '../../test-utils/query';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('@osac/ui-components/api/v1/cluster', () => ({
  useClustersForCatalogItem: vi.fn(),
}));
vi.mock('@osac/ui-components/api/v1/compute-instance', () => ({
  useComputeInstancesForCatalogItem: vi.fn(),
}));
vi.mock('@osac/ui-components/api/v1/baremetal-instance', () => ({
  useBareMetalInstancesForCatalogItem: vi.fn(),
}));

const { useClustersForCatalogItem } = await import('@osac/ui-components/api/v1/cluster');
const { useComputeInstancesForCatalogItem } =
  await import('@osac/ui-components/api/v1/compute-instance');
const { useBareMetalInstancesForCatalogItem } =
  await import('@osac/ui-components/api/v1/baremetal-instance');

const CatalogItemProvisionedResourcesTab = (await import('./CatalogItemProvisionedResourcesTab'))
  .default;

const cluster = (id: string): Cluster =>
  ({
    id,
    metadata: { name: `cluster-${id}` },
    status: {},
  }) as Cluster;

describe('CatalogItemProvisionedResourcesTab', () => {
  beforeEach(() => {
    vi.mocked(useClustersForCatalogItem).mockReturnValue(
      mockQueryResult({ data: { items: [], total: 0 } }) as ReturnType<
        typeof useClustersForCatalogItem
      >,
    );
    vi.mocked(useComputeInstancesForCatalogItem).mockReturnValue(
      mockQueryResult({ data: { items: [], total: 0 } }) as ReturnType<
        typeof useComputeInstancesForCatalogItem
      >,
    );
    vi.mocked(useBareMetalInstancesForCatalogItem).mockReturnValue(
      mockQueryResult({ data: { items: [], total: 0 } }) as ReturnType<
        typeof useBareMetalInstancesForCatalogItem
      >,
    );
  });

  it('renders cluster rows linking to the cluster detail page', () => {
    vi.mocked(useClustersForCatalogItem).mockReturnValue(
      mockQueryResult({
        data: { items: [cluster('cluster-1')], total: 1 },
      }) as ReturnType<typeof useClustersForCatalogItem>,
    );

    renderWithProviders(
      <CatalogItemProvisionedResourcesTab catalogItemId="catalog-1" kind="cluster" />,
    );

    const link = screen.getByRole('link', { name: 'cluster-cluster-1' });
    expect(link).toHaveAttribute('href', '/clusters/cluster-1');
  });

  it('only queries the hook matching the given kind', () => {
    renderWithProviders(
      <CatalogItemProvisionedResourcesTab catalogItemId="catalog-1" kind="cluster" />,
    );

    expect(useClustersForCatalogItem).toHaveBeenCalledWith(
      'catalog-1',
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
    expect(useComputeInstancesForCatalogItem).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
    expect(useBareMetalInstancesForCatalogItem).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
  });

  it('renders an empty state when there are no provisioned resources', () => {
    renderWithProviders(
      <CatalogItemProvisionedResourcesTab catalogItemId="catalog-1" kind="cluster" />,
    );

    expect(
      screen.getByText('No resources have been provisioned from this catalog item.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows a loading spinner while the query is in flight', () => {
    vi.mocked(useClustersForCatalogItem).mockReturnValue(mockQueryResult({ isLoading: true }));

    renderWithProviders(
      <CatalogItemProvisionedResourcesTab catalogItemId="catalog-1" kind="cluster" />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not render pagination when there are no results', () => {
    renderWithProviders(
      <CatalogItemProvisionedResourcesTab catalogItemId="catalog-1" kind="cluster" />,
    );

    expect(screen.queryByLabelText(/pagination/i)).not.toBeInTheDocument();
  });

  it('renders pagination sized to the total item count', () => {
    vi.mocked(useClustersForCatalogItem).mockReturnValue(
      mockQueryResult({
        data: { items: [cluster('cluster-1')], total: 42 },
      }) as ReturnType<typeof useClustersForCatalogItem>,
    );

    renderWithProviders(
      <CatalogItemProvisionedResourcesTab catalogItemId="catalog-1" kind="cluster" />,
    );

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('advances to the next page and re-queries with the updated offset', async () => {
    vi.mocked(useClustersForCatalogItem).mockReturnValue(
      mockQueryResult({
        data: { items: [cluster('cluster-1')], total: 42 },
      }) as ReturnType<typeof useClustersForCatalogItem>,
    );

    const { user } = renderWithProviders(
      <CatalogItemProvisionedResourcesTab catalogItemId="catalog-1" kind="cluster" />,
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
      <CatalogItemProvisionedResourcesTab catalogItemId="catalog-1" kind="cluster" />,
    );

    await user.click(screen.getByRole('button', { name: /go to next page/i }));
    expect(useClustersForCatalogItem).toHaveBeenLastCalledWith(
      'catalog-1',
      expect.objectContaining({ offset: 10 }),
    );

    rerender(<CatalogItemProvisionedResourcesTab catalogItemId="catalog-2" kind="cluster" />);

    expect(useClustersForCatalogItem).toHaveBeenLastCalledWith(
      'catalog-2',
      expect.objectContaining({ offset: 0 }),
    );
  });
});
