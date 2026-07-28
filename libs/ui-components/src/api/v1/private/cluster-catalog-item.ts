import { ClusterCatalogItems } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

export const usePrivateClusterCatalogItems = (params: ListParams = {}, enabled = true) => {
  const client = useApiFetch(ClusterCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/cluster_catalog_items', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled,
  });
};

export const usePrivateClusterCatalogItem = (id: string | undefined) => {
  const client = useApiFetch(ClusterCatalogItems);
  const trimmedId = id?.trim() ?? '';
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/cluster_catalog_items', trimmedId ? [trimmedId] : undefined),
    queryFn: () => client.get({ id: trimmedId }),
    select: (data) => data.object,
    enabled: Boolean(trimmedId),
  });
};
