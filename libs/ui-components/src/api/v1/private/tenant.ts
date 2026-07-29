import { Tenants } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

// CSP Admin only (see CatalogItemGeneralFields) — picking which tenant to scope a catalog item
// to requires visibility across all tenants, which only the private API grants.
export const usePrivateTenants = (enabled = true) => {
  const client = useApiFetch(Tenants);
  return useApiQuery({
    queryKey: apiQueryKey('v1/tenants_private'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
  });
};
