import type { UseQueryResult } from '@tanstack/react-query';

import type { DemoShellRole } from '../../shellTypes';

interface CatalogItemWithTemplate {
  template: string;
}

interface UseCatalogItemDetailDataParams<TPublic, TPrivate, TTemplate> {
  id: string | undefined;
  role: DemoShellRole;
  usePublicItem: (id: string | undefined) => UseQueryResult<TPublic | undefined, unknown>;
  usePrivateItem: (id: string | undefined) => UseQueryResult<TPrivate | undefined, unknown>;
  useTemplate: (templateId: string | undefined) => UseQueryResult<TTemplate | undefined, unknown>;
}

/** Shared role-gating + template resolution for the three kind-specific catalog item detail
 * pages: pick the public or private hook based on role, then resolve the item's template. */
export const useCatalogItemDetailData = <
  TPublic extends CatalogItemWithTemplate,
  TPrivate extends CatalogItemWithTemplate,
  TTemplate,
>({
  id,
  role,
  usePublicItem,
  usePrivateItem,
  useTemplate,
}: UseCatalogItemDetailDataParams<TPublic, TPrivate, TTemplate>) => {
  const isProviderAdmin = role === 'providerAdmin';
  const publicResult = usePublicItem(!isProviderAdmin ? id : undefined);
  const privateResult = usePrivateItem(isProviderAdmin ? id : undefined);
  const active = isProviderAdmin ? privateResult : publicResult;

  const { data: template } = useTemplate(active.data?.template);

  return { ...active, template };
};
