import { Tenants as PrivateTenants } from '@osac/types/private';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

// CSP Admin only (see CatalogItemGeneralFields) — picking which tenant to scope a catalog item
// to requires visibility across all tenants, which only the private API grants.
export const useTenants = (enabled = true) => {
  const client = useApiFetch(PrivateTenants);
  return useApiQuery({
    queryKey: apiQueryKey('v1/tenants_private'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
    // Reference data for a wizard dropdown — no need to poll while the form is open.
    refetchInterval: false,
  });
};
