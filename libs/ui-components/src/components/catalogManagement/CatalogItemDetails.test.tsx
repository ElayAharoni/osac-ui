import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import CatalogItemDetails from './CatalogItemDetails';
import { renderWithProviders } from '../../test-utils/TestProviders';

const catalogItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-1',
  title: 'OpenShift 4 cluster',
  description: 'A standard OpenShift cluster',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [
    {
      $typeName: 'osac.public.v1.FieldDefinition',
      path: 'release_image',
      displayName: 'Release Image',
      editable: false,
      default: {
        $typeName: 'google.protobuf.Value',
        kind: { case: 'stringValue', value: 'quay.io/release:4.17' },
      },
      validationSchema: '',
    },
  ],
};

describe('CatalogItemDetails', () => {
  it('renders the header with name and status', () => {
    renderWithProviders(
      <CatalogItemDetails catalogItem={catalogItem} kind="cluster" role="tenantAdmin" />,
    );

    expect(screen.getByRole('heading', { name: 'OpenShift 4 cluster' })).toBeInTheDocument();
    expect(screen.getAllByText('Published').length).toBeGreaterThan(0);
  });

  it('renders the header actions, with Delete and the publish toggle disabled', () => {
    renderWithProviders(
      <CatalogItemDetails catalogItem={catalogItem} kind="cluster" role="providerAdmin" />,
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('shows the Overview tab by default and switches to other tabs on click', async () => {
    const { user } = renderWithProviders(
      <CatalogItemDetails catalogItem={catalogItem} kind="cluster" role="tenantAdmin" />,
    );

    expect(screen.getByText('A standard OpenShift cluster')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Field Definitions' }));
    expect(screen.getByText('release_image')).toBeInTheDocument();
  });
});
