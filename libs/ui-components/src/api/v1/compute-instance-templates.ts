import { ComputeInstanceTemplates } from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const useComputeInstanceTemplate = (id: string | undefined) => {
  const client = useApiFetch(ComputeInstanceTemplates);
  return useApiQuery({
    queryKey: apiQueryKey('v1/compute_instance_templates', id ? [id] : undefined),
    queryFn: () => client.get({ id: id ?? '' }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};
