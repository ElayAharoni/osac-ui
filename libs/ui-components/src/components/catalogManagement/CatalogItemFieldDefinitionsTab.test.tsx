import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import CatalogItemFieldDefinitionsTab from './CatalogItemFieldDefinitionsTab';
import { renderWithProviders } from '../../test-utils/TestProviders';

const itemWithFields = (
  fieldDefinitions: ClusterCatalogItem['fieldDefinitions'],
): ClusterCatalogItem => ({
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-1',
  title: 'OpenShift 4 cluster',
  description: '',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions,
});

const coresField = {
  $typeName: 'osac.public.v1.FieldDefinition' as const,
  path: 'cores',
  displayName: 'vCPUs',
  editable: true,
  default: {
    $typeName: 'google.protobuf.Value' as const,
    kind: { case: 'numberValue' as const, value: 4 },
  },
  validationSchema: '{"minimum":1,"maximum":16}',
};

const releaseImageField = {
  $typeName: 'osac.public.v1.FieldDefinition' as const,
  path: 'release_image',
  displayName: 'Release Image',
  editable: false,
  default: {
    $typeName: 'google.protobuf.Value' as const,
    kind: { case: 'stringValue' as const, value: 'quay.io/release:4.17' },
  },
  validationSchema: '',
};

describe('CatalogItemFieldDefinitionsTab', () => {
  it('renders a row per field definition with all columns in the correct cells', () => {
    renderWithProviders(
      <CatalogItemFieldDefinitionsTab
        catalogItem={itemWithFields([coresField, releaseImageField])}
      />,
    );

    const rows = screen.getAllByRole('row');
    const coresRow = within(rows[1]);
    expect(coresRow.getByText('cores')).toBeInTheDocument();
    expect(coresRow.getByText('vCPUs')).toBeInTheDocument();
    expect(coresRow.getByText('Yes')).toBeInTheDocument();
    expect(coresRow.getByText('4')).toBeInTheDocument();
    expect(coresRow.getByText('min: 1, max: 16')).toBeInTheDocument();

    const releaseImageRow = within(rows[2]);
    expect(releaseImageRow.getByText('release_image')).toBeInTheDocument();
    expect(releaseImageRow.getByText('Release Image')).toBeInTheDocument();
    expect(releaseImageRow.getByText('No')).toBeInTheDocument();
    expect(releaseImageRow.getByText('quay.io/release:4.17')).toBeInTheDocument();
    expect(releaseImageRow.getByText('—')).toBeInTheDocument();
  });

  it('renders an empty state when there are no field definitions', () => {
    renderWithProviders(<CatalogItemFieldDefinitionsTab catalogItem={itemWithFields([])} />);

    expect(
      screen.getByText('No field definitions have been configured for this catalog item.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
