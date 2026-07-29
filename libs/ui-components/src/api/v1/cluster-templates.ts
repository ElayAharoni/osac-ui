import { ClusterTemplates } from '@osac/types';

import { useSession } from '../../hooks/use-session';
import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';
import { usePrivateClusterTemplates } from './private/cluster-templates';

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
  });
};

export const useAdminClusterTemplates = (enabled = true) => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicResult = useClusterTemplates(enabled && !isProviderAdmin);
  const privateResult = usePrivateClusterTemplates(enabled && isProviderAdmin);
  return isProviderAdmin ? privateResult : publicResult;
};
