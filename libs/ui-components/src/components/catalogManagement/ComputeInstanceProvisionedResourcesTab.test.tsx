import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';

import { mockQueryResult } from '../../test-utils/query';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('@osac/ui-components/api/v1/compute-instance', () => ({
  useComputeInstancesForCatalogItem: vi.fn(),
}));

const { useComputeInstancesForCatalogItem } =
  await import('@osac/ui-components/api/v1/compute-instance');

const ComputeInstanceProvisionedResourcesTab = (
  await import('./ComputeInstanceProvisionedResourcesTab')
).default;

const vm = (id: string): ComputeInstance =>
  ({
    id,
    metadata: { name: `vm-${id}` },
    status: {},
  }) as ComputeInstance;

describe('ComputeInstanceProvisionedResourcesTab', () => {
  beforeEach(() => {
    vi.mocked(useComputeInstancesForCatalogItem).mockReturnValue(
      mockQueryResult({ data: { items: [], total: 0 } }) as ReturnType<
        typeof useComputeInstancesForCatalogItem
      >,
    );
  });

  it('renders VM rows linking to the VM detail page', () => {
    vi.mocked(useComputeInstancesForCatalogItem).mockReturnValue(
      mockQueryResult({
        data: { items: [vm('vm-1')], total: 1 },
      }) as ReturnType<typeof useComputeInstancesForCatalogItem>,
    );

    renderWithProviders(<ComputeInstanceProvisionedResourcesTab catalogItemId="catalog-1" />);

    const link = screen.getByRole('link', { name: 'vm-vm-1' });
    expect(link).toHaveAttribute('href', '/vms/vm-1');
  });

  it('queries only VMs scoped to the given catalog item id', () => {
    renderWithProviders(<ComputeInstanceProvisionedResourcesTab catalogItemId="catalog-1" />);

    expect(useComputeInstancesForCatalogItem).toHaveBeenCalledWith(
      'catalog-1',
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
  });
});
