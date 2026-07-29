import { useParams } from 'react-router-dom';

import { useClusterCatalogItem } from '../../../api/v1/cluster-catalog-item';
import { useClusterTemplate } from '../../../api/v1/cluster-templates';
import { usePrivateClusterCatalogItem } from '../../../api/v1/private/cluster-catalog-item';
import { useSession } from '../../../hooks/use-session';
import CatalogItemDetailPageShell from '../CatalogItemDetailPageShell';
import { useCatalogItemDetailData } from '../useCatalogItemDetailData';

const ClusterCatalogItemDetailPage = () => {
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
    usePublicItem: useClusterCatalogItem,
    usePrivateItem: usePrivateClusterCatalogItem,
    useTemplate: useClusterTemplate,
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

export default ClusterCatalogItemDetailPage;
