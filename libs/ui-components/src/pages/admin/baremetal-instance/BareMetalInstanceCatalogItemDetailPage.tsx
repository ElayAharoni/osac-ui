import { useParams } from 'react-router-dom';

import { useBareMetalInstanceCatalogItem } from '../../../api/v1/baremetal-instance';
import { useBareMetalInstanceTemplate } from '../../../api/v1/baremetal-instance-templates';
import { usePrivateBareMetalInstanceCatalogItem } from '../../../api/v1/private/baremetal-instance-catalog-item';
import { useSession } from '../../../hooks/use-session';
import CatalogItemDetailPageShell from '../CatalogItemDetailPageShell';

const BareMetalInstanceCatalogItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';

  const publicResult = useBareMetalInstanceCatalogItem(!isProviderAdmin ? id : undefined);
  const privateResult = usePrivateBareMetalInstanceCatalogItem(isProviderAdmin ? id : undefined);
  const {
    data: catalogItem,
    isLoading,
    isError,
    error,
    refetch,
  } = isProviderAdmin ? privateResult : publicResult;

  const { data: template } = useBareMetalInstanceTemplate(catalogItem?.template);

  return (
    <CatalogItemDetailPageShell
      catalogItem={catalogItem}
      kind="baremetal-instance"
      role={role}
      templateName={template?.title ?? catalogItem?.template}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => void refetch()}
    />
  );
};

export default BareMetalInstanceCatalogItemDetailPage;
