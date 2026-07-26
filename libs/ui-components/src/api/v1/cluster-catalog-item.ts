import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { ClusterCatalogItemSchema, ClusterCatalogItems } from '@osac/types';
import {
  ClusterCatalogItemSchema as PrivateClusterCatalogItemSchema,
  ClusterCatalogItems as PrivateClusterCatalogItems,
} from '@osac/types/private';

import { useSession } from '../../hooks/use-session';
import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export const useClusterCatalogItems = (params: ListParams = {}, enabled = true) => {
  const client = useApiFetch(ClusterCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/cluster_catalog_items', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled,
  });
};

export const useClusterCatalogItem = (id: string | undefined) => {
  const client = useApiFetch(ClusterCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/cluster_catalog_items', id ? [id] : undefined),
    queryFn: () => client.get({ id: id ?? '' }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};

export const useCreateClusterCatalogItem = () => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicClient = useApiFetch(ClusterCatalogItems);
  const privateClient = useApiFetch(PrivateClusterCatalogItems);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (item: MessageInitShape<typeof ClusterCatalogItemSchema>) =>
      (isProviderAdmin
        ? privateClient.create({
            object: item as MessageInitShape<typeof PrivateClusterCatalogItemSchema>,
          })
        : publicClient.create({ object: item })
      ).then((response) => response.object),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/cluster_catalog_items') }),
  });
};
