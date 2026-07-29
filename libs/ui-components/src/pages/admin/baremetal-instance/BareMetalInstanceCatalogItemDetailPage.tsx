import { useParams } from 'react-router-dom';

import { useBareMetalInstanceCatalogItem } from '../../../api/v1/baremetal-instance';
import { useBareMetalInstanceTemplate } from '../../../api/v1/baremetal-instance-templates';
import { usePrivateBareMetalInstanceCatalogItem } from '../../../api/v1/private/baremetal-instance-catalog-item';
import { useSession } from '../../../hooks/use-session';
import CatalogItemDetailPageShell from '../CatalogItemDetailPageShell';
import { useCatalogItemDetailData } from '../useCatalogItemDetailData';

const BareMetalInstanceCatalogItemDetailPage = () => {
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
    usePublicItem: useBareMetalInstanceCatalogItem,
    usePrivateItem: usePrivateBareMetalInstanceCatalogItem,
    useTemplate: useBareMetalInstanceTemplate,
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

export default BareMetalInstanceCatalogItemDetailPage;
