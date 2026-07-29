import { ComputeInstanceTemplates } from '@osac/types';

import { useSession } from '../../hooks/use-session';
import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';
import { usePrivateComputeInstanceTemplates } from './private/compute-instance-templates';

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
  const privateResult = usePrivateComputeInstanceTemplates(enabled && isProviderAdmin);
  return isProviderAdmin ? privateResult : publicResult;
};
