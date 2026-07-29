import { Projects } from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const useProjects = (enabled = true) => {
  const client = useApiFetch(Projects);
  return useApiQuery({
    queryKey: apiQueryKey('v1/projects'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
  });
};
