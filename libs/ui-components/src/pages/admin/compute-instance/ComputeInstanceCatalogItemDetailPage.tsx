import { useParams } from 'react-router-dom';

import { useComputeInstanceCatalogItem } from '../../../api/v1/compute-instance-catalog-item';
import { useComputeInstanceTemplate } from '../../../api/v1/compute-instance-templates';
import { usePrivateComputeInstanceCatalogItem } from '../../../api/v1/private/compute-instance-catalog-item';
import { useSession } from '../../../hooks/use-session';
import CatalogItemDetailPageShell from '../CatalogItemDetailPageShell';

const ComputeInstanceCatalogItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';

  const publicResult = useComputeInstanceCatalogItem(!isProviderAdmin ? id : undefined);
  const privateResult = usePrivateComputeInstanceCatalogItem(isProviderAdmin ? id : undefined);
  const {
    data: catalogItem,
    isLoading,
    isError,
    error,
    refetch,
  } = isProviderAdmin ? privateResult : publicResult;

  const { data: template } = useComputeInstanceTemplate(catalogItem?.template);

  return (
    <CatalogItemDetailPageShell
      catalogItem={catalogItem}
      kind="compute-instance"
      role={role}
      templateName={template?.title ?? catalogItem?.template}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => void refetch()}
    />
  );
};

export default ComputeInstanceCatalogItemDetailPage;
