import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import CatalogItemDetailPageShell from './CatalogItemDetailPageShell';
import { renderWithProviders } from '../../test-utils/TestProviders';

const catalogItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-1',
  title: 'OpenShift 4 cluster',
  description: '',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [],
};

describe('CatalogItemDetailPageShell', () => {
  it('shows a loading state and not the real content', () => {
    renderWithProviders(
      <CatalogItemDetailPageShell
        catalogItem={undefined}
        role="tenantAdmin"
        isLoading
        isError={false}
        error={undefined}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.queryByRole('heading', { name: 'OpenShift 4 cluster' })).not.toBeInTheDocument();
    expect(screen.getByText('Catalog management')).toBeInTheDocument();
  });

  it('shows an error state when the query fails', () => {
    renderWithProviders(
      <CatalogItemDetailPageShell
        catalogItem={undefined}
        role="tenantAdmin"
        isLoading={false}
        isError
        error={new Error('boom')}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Could not load catalog item')).toBeInTheDocument();
  });

  it('shows a not-found state when the item does not exist', () => {
    renderWithProviders(
      <CatalogItemDetailPageShell
        catalogItem={undefined}
        role="tenantAdmin"
        isLoading={false}
        isError={false}
        error={undefined}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Catalog item not found')).toBeInTheDocument();
  });

  it('renders CatalogItemDetails once the catalog item is loaded', () => {
    renderWithProviders(
      <CatalogItemDetailPageShell
        catalogItem={catalogItem}
        role="tenantAdmin"
        templateName="OpenShift 4 Template"
        isLoading={false}
        isError={false}
        error={undefined}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'OpenShift 4 cluster' })).toBeInTheDocument();
    expect(screen.getByText('OpenShift 4 Template')).toBeInTheDocument();
  });
});
