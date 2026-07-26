import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { ComputeInstanceCatalogItemSchema, ComputeInstanceCatalogItems } from '@osac/types';
import {
  ComputeInstanceCatalogItemSchema as PrivateComputeInstanceCatalogItemSchema,
  ComputeInstanceCatalogItems as PrivateComputeInstanceCatalogItems,
} from '@osac/types/private';

import { useSession } from '../../hooks/use-session';
import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export const useComputeInstanceCatalogItems = (params: ListParams = {}, enabled = true) => {
  const client = useApiFetch(ComputeInstanceCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/compute_instance_catalog_items', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled,
  });
};

export const useComputeInstanceCatalogItem = (id: string | undefined) => {
  const client = useApiFetch(ComputeInstanceCatalogItems);
  const trimmedId = id?.trim() ?? '';
  return useApiQuery({
    queryKey: apiQueryKey('v1/compute_instance_catalog_items', trimmedId ? [trimmedId] : undefined),
    queryFn: () => client.get({ id: trimmedId }),
    select: (data) => data.object,
    enabled: Boolean(trimmedId),
  });
};

export const useCreateComputeInstanceCatalogItem = () => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicClient = useApiFetch(ComputeInstanceCatalogItems);
  const privateClient = useApiFetch(PrivateComputeInstanceCatalogItems);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (item: MessageInitShape<typeof ComputeInstanceCatalogItemSchema>) =>
      (isProviderAdmin
        ? privateClient.create({
            object: item as MessageInitShape<typeof PrivateComputeInstanceCatalogItemSchema>,
          })
        : publicClient.create({ object: item })
      ).then((response) => response.object),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: apiQueryKey('v1/compute_instance_catalog_items') }),
  });
};
