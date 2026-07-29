import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BareMetalInstance } from '@osac/types';

import { mockQueryResult } from '../../test-utils/query';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('@osac/ui-components/api/v1/baremetal-instance', () => ({
  useBareMetalInstancesForCatalogItem: vi.fn(),
}));

const { useBareMetalInstancesForCatalogItem } =
  await import('@osac/ui-components/api/v1/baremetal-instance');

const BareMetalInstanceProvisionedResourcesTab = (
  await import('./BareMetalInstanceProvisionedResourcesTab')
).default;

const bmi = (id: string): BareMetalInstance =>
  ({
    id,
    metadata: { name: `bmi-${id}` },
    status: {},
  }) as BareMetalInstance;

describe('BareMetalInstanceProvisionedResourcesTab', () => {
  beforeEach(() => {
    vi.mocked(useBareMetalInstancesForCatalogItem).mockReturnValue(
      mockQueryResult({ data: { items: [], total: 0 } }) as ReturnType<
        typeof useBareMetalInstancesForCatalogItem
      >,
    );
  });

  it('renders bare metal instance rows linking to the detail page', () => {
    vi.mocked(useBareMetalInstancesForCatalogItem).mockReturnValue(
      mockQueryResult({
        data: { items: [bmi('bmi-1')], total: 1 },
      }) as ReturnType<typeof useBareMetalInstancesForCatalogItem>,
    );

    renderWithProviders(<BareMetalInstanceProvisionedResourcesTab catalogItemId="catalog-1" />);

    const link = screen.getByRole('link', { name: 'bmi-bmi-1' });
    expect(link).toHaveAttribute('href', '/bare-metal/bmi-1');
  });

  it('queries only bare metal instances scoped to the given catalog item id', () => {
    renderWithProviders(<BareMetalInstanceProvisionedResourcesTab catalogItemId="catalog-1" />);

    expect(useBareMetalInstancesForCatalogItem).toHaveBeenCalledWith(
      'catalog-1',
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
  });
});
