import { ComputeInstanceTemplates } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

export const usePrivateComputeInstanceTemplates = (enabled = true) => {
  const client = useApiFetch(ComputeInstanceTemplates);
  return useApiQuery({
    queryKey: apiQueryKey('v1/compute_instance_templates_private'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
  });
};
