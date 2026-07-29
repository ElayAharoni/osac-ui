import type { CatalogItem } from '../catalog/catalogItemDisplay';

export type CatalogItemDetailKind = 'cluster' | 'compute-instance' | 'baremetal-instance';

export const catalogItemDetailKind = (item: CatalogItem): CatalogItemDetailKind => {
  switch (item.$typeName) {
    case 'osac.public.v1.ClusterCatalogItem':
    case 'osac.private.v1.ClusterCatalogItem':
      return 'cluster';
    case 'osac.public.v1.ComputeInstanceCatalogItem':
    case 'osac.private.v1.ComputeInstanceCatalogItem':
      return 'compute-instance';
    case 'osac.public.v1.BareMetalInstanceCatalogItem':
    case 'osac.private.v1.BareMetalInstanceCatalogItem':
      return 'baremetal-instance';
    default: {
      const exhaustiveCheck: never = item;
      void exhaustiveCheck;
      return 'compute-instance';
    }
  }
};
