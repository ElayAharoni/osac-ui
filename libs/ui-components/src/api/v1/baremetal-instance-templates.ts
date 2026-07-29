import { BareMetalInstanceTemplates } from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const useBareMetalInstanceTemplate = (id: string | undefined) => {
  const client = useApiFetch(BareMetalInstanceTemplates);
  return useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instance_templates', id ? [id] : undefined),
    queryFn: () => client.get({ id: id ?? '' }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};
