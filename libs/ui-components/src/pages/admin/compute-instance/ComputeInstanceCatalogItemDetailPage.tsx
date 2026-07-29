import { useParams } from 'react-router-dom';

import { useComputeInstanceCatalogItem } from '../../../api/v1/compute-instance-catalog-item';
import { useComputeInstanceTemplate } from '../../../api/v1/compute-instance-templates';
import { usePrivateComputeInstanceCatalogItem } from '../../../api/v1/private/compute-instance-catalog-item';
import { useSession } from '../../../hooks/use-session';
import CatalogItemDetailPageShell from '../CatalogItemDetailPageShell';
import { useCatalogItemDetailData } from '../useCatalogItemDetailData';

const ComputeInstanceCatalogItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useSession();

  const {
    data: catalogItem,
    isLoading,
    isError,
    error,
    refetch,
    template,
  } = useCatalogItemDetailData({
    id,
    role,
    usePublicItem: useComputeInstanceCatalogItem,
    usePrivateItem: usePrivateComputeInstanceCatalogItem,
    useTemplate: useComputeInstanceTemplate,
  });

  return (
    <CatalogItemDetailPageShell
      catalogItem={catalogItem}
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
