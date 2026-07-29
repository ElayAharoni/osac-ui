import { BareMetalInstanceTemplates } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

export const usePrivateBareMetalInstanceTemplates = (enabled = true) => {
  const client = useApiFetch(BareMetalInstanceTemplates);
  return useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instance_templates_private'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
  });
};
