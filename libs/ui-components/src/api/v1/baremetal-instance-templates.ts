import { BareMetalInstanceTemplates } from '@osac/types';
import { BareMetalInstanceTemplates as PrivateBareMetalInstanceTemplates } from '@osac/types/private';

import { useSession } from '../../hooks/use-session';
import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const useBareMetalInstanceTemplates = (enabled = true) => {
  const client = useApiFetch(BareMetalInstanceTemplates);
  return useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instance_templates'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
  });
};

export const useAdminBareMetalInstanceTemplates = (enabled = true) => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicResult = useBareMetalInstanceTemplates(enabled && !isProviderAdmin);
  const privateClient = useApiFetch(PrivateBareMetalInstanceTemplates);
  const privateResult = useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instance_templates_private'),
    queryFn: () => privateClient.list({}),
    select: (data) => data.items,
    enabled: enabled && isProviderAdmin,
  });
  return isProviderAdmin ? privateResult : publicResult;
};
