import { ClusterTemplates } from '@osac/types';
import { ClusterTemplates as PrivateClusterTemplates } from '@osac/types/private';

import { useSession } from '../../hooks/use-session';
import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const useClusterTemplate = (id: string | undefined) => {
  const client = useApiFetch(ClusterTemplates);
  return useApiQuery({
    queryKey: apiQueryKey('v1/cluster_templates', id ? [id] : undefined),
    queryFn: () => client.get({ id: id ?? '' }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};

export const useClusterTemplates = (enabled = true) => {
  const client = useApiFetch(ClusterTemplates);
  return useApiQuery({
    queryKey: apiQueryKey('v1/cluster_templates'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
    // Reference data for a wizard dropdown — no need to poll while the form is open.
    refetchInterval: false,
  });
};

export const useAdminClusterTemplates = (enabled = true) => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicResult = useClusterTemplates(enabled && !isProviderAdmin);
  const privateClient = useApiFetch(PrivateClusterTemplates);
  const privateResult = useApiQuery({
    queryKey: apiQueryKey('v1/cluster_templates_private'),
    queryFn: () => privateClient.list({}),
    select: (data) => data.items,
    enabled: enabled && isProviderAdmin,
    refetchInterval: false,
  });
  return isProviderAdmin ? privateResult : publicResult;
};
