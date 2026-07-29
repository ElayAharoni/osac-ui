import { ClusterTemplates } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

export const usePrivateClusterTemplates = (enabled = true) => {
  const client = useApiFetch(ClusterTemplates);
  return useApiQuery({
    queryKey: apiQueryKey('v1/cluster_templates_private'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
  });
};
