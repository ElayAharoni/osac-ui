import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import CatalogItemOverviewTab from './CatalogItemOverviewTab';
import { renderWithProviders } from '../../test-utils/TestProviders';

const baseItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-1',
  title: 'OpenShift 4 cluster',
  description: '',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [],
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    name: 'catalog-1',
    creator: 'admin',
    tenant: '',
    project: '',
    labels: {},
    annotations: {},
    version: 1,
    creationTimestamp: { $typeName: 'google.protobuf.Timestamp', seconds: 1700000000n, nanos: 0 },
  },
};

describe('CatalogItemOverviewTab', () => {
  it('renders name, resource type, template name, and status', () => {
    renderWithProviders(
      <CatalogItemOverviewTab
        catalogItem={baseItem}
        role="tenantAdmin"
        templateName="OpenShift 4 Template"
      />,
    );

    expect(screen.getByText('OpenShift 4 cluster')).toBeInTheDocument();
    expect(screen.getByText('Cluster')).toBeInTheDocument();
    expect(screen.getByText('OpenShift 4 Template')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('renders the scope badge for the given role', () => {
    renderWithProviders(<CatalogItemOverviewTab catalogItem={baseItem} role="tenantAdmin" />);
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('renders the rendered Markdown description when present', () => {
    renderWithProviders(
      <CatalogItemOverviewTab
        catalogItem={{ ...baseItem, description: 'A **standard** OpenShift cluster' }}
        role="tenantAdmin"
      />,
    );
    expect(screen.getByText('standard').tagName).toBe('STRONG');
  });

  it('renders a fallback when description is empty', () => {
    renderWithProviders(
      <CatalogItemOverviewTab
        catalogItem={{ ...baseItem, description: '' }}
        role="tenantAdmin"
        templateName="OpenShift 4 Template"
      />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders a fallback when template name is not provided', () => {
    renderWithProviders(
      <CatalogItemOverviewTab
        catalogItem={{ ...baseItem, description: 'A standard OpenShift cluster' }}
        role="tenantAdmin"
      />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('labels a compute instance catalog item as a Virtual Machine', () => {
    renderWithProviders(
      <CatalogItemOverviewTab
        catalogItem={{
          ...baseItem,
          $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
        }}
        role="tenantAdmin"
      />,
    );
    expect(screen.getByText('Virtual Machine')).toBeInTheDocument();
  });

  it('labels a bare metal catalog item as Bare Metal', () => {
    renderWithProviders(
      <CatalogItemOverviewTab
        catalogItem={{
          ...baseItem,
          $typeName: 'osac.public.v1.BareMetalInstanceCatalogItem',
        }}
        role="tenantAdmin"
      />,
    );
    expect(screen.getByText('Bare Metal')).toBeInTheDocument();
  });
});
