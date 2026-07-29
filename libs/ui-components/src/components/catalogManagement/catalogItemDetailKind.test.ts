import { describe, expect, it } from 'vitest';

import type {
  BareMetalInstanceCatalogItem,
  ClusterCatalogItem,
  ComputeInstanceCatalogItem,
} from '@osac/types';
import type {
  BareMetalInstanceCatalogItem as PrivateBareMetalInstanceCatalogItem,
  ClusterCatalogItem as PrivateClusterCatalogItem,
  ComputeInstanceCatalogItem as PrivateComputeInstanceCatalogItem,
} from '@osac/types/private';

import { catalogItemDetailKind } from './catalogItemDetailKind';

const baseFields = {
  id: 'catalog-1',
  title: 'OpenShift 4 cluster',
  description: '',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [],
};

const publicClusterItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  ...baseFields,
};

const privateClusterItem: PrivateClusterCatalogItem = {
  $typeName: 'osac.private.v1.ClusterCatalogItem',
  tenant: '',
  ...baseFields,
};

const publicComputeInstanceItem: ComputeInstanceCatalogItem = {
  $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
  ...baseFields,
};

const privateComputeInstanceItem: PrivateComputeInstanceCatalogItem = {
  $typeName: 'osac.private.v1.ComputeInstanceCatalogItem',
  tenant: '',
  ...baseFields,
};

const publicBareMetalInstanceItem: BareMetalInstanceCatalogItem = {
  $typeName: 'osac.public.v1.BareMetalInstanceCatalogItem',
  ...baseFields,
};

const privateBareMetalInstanceItem: PrivateBareMetalInstanceCatalogItem = {
  $typeName: 'osac.private.v1.BareMetalInstanceCatalogItem',
  tenant: '',
  ...baseFields,
};

describe('catalogItemDetailKind', () => {
  it('returns cluster for public and private ClusterCatalogItem', () => {
    expect(catalogItemDetailKind(publicClusterItem)).toBe('cluster');
    expect(catalogItemDetailKind(privateClusterItem)).toBe('cluster');
  });

  it('returns compute-instance for public and private ComputeInstanceCatalogItem', () => {
    expect(catalogItemDetailKind(publicComputeInstanceItem)).toBe('compute-instance');
    expect(catalogItemDetailKind(privateComputeInstanceItem)).toBe('compute-instance');
  });

  it('returns baremetal-instance for public and private BareMetalInstanceCatalogItem', () => {
    expect(catalogItemDetailKind(publicBareMetalInstanceItem)).toBe('baremetal-instance');
    expect(catalogItemDetailKind(privateBareMetalInstanceItem)).toBe('baremetal-instance');
  });
});
