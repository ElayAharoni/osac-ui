import { ComputeInstanceTemplates } from '@osac/types';
import { ComputeInstanceTemplates as PrivateComputeInstanceTemplates } from '@osac/types/private';

import { useSession } from '../../hooks/use-session';
import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const useComputeInstanceTemplates = (enabled = true) => {
  const client = useApiFetch(ComputeInstanceTemplates);
  return useApiQuery({
    queryKey: apiQueryKey('v1/compute_instance_templates'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
  });
};

export const useAdminComputeInstanceTemplates = (enabled = true) => {
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';
  const publicResult = useComputeInstanceTemplates(enabled && !isProviderAdmin);
  const privateClient = useApiFetch(PrivateComputeInstanceTemplates);
  const privateResult = useApiQuery({
    queryKey: apiQueryKey('v1/compute_instance_templates_private'),
    queryFn: () => privateClient.list({}),
    select: (data) => data.items,
    enabled: enabled && isProviderAdmin,
  });
  return isProviderAdmin ? privateResult : publicResult;
};
