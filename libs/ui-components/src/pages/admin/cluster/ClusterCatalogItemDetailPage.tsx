import { useParams } from 'react-router-dom';

import { useClusterCatalogItem } from '../../../api/v1/cluster-catalog-item';
import { useClusterTemplate } from '../../../api/v1/cluster-templates';
import { usePrivateClusterCatalogItem } from '../../../api/v1/private/cluster-catalog-item';
import CatalogItemDetails from '../../../components/catalogManagement/CatalogItemDetails';
import { ResourceDetailsPageError } from '../../../components/Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../../../components/Resource/ResourceDetailsPageLoading';
import { useSession } from '../../../hooks/use-session';
import { useTranslation } from '../../../hooks/useTranslation';

const ClusterCatalogItemDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { role } = useSession();
  const isProviderAdmin = role === 'providerAdmin';

  const publicResult = useClusterCatalogItem(!isProviderAdmin ? id : undefined);
  const privateResult = usePrivateClusterCatalogItem(isProviderAdmin ? id : undefined);
  const {
    data: catalogItem,
    isLoading,
    isError,
    error,
    refetch,
  } = isProviderAdmin ? privateResult : publicResult;

  const { data: template } = useClusterTemplate(catalogItem?.template);

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo="/admin/catalog"
        parentLabel={t('Catalog management')}
        tabLabels={[t('Overview'), t('Field Definitions'), t('Provisioned Resources')]}
        tabsId="catalog-item-detail-tabs-loading"
        cardCount={2}
      />
    );
  }

  if (isError) {
    return (
      <ResourceDetailsPageError
        parentTo="/admin/catalog"
        parentLabel={t('Catalog management')}
        resourceLabel="catalog item"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!catalogItem) {
    return (
      <ResourceDetailsPageError
        parentTo="/admin/catalog"
        parentLabel={t('Catalog management')}
        resourceLabel="catalog item"
        variant="not-found"
      />
    );
  }

  return (
    <CatalogItemDetails
      catalogItem={catalogItem}
      kind="cluster"
      role={role}
      templateName={template?.title ?? catalogItem.template}
    />
  );
};

export default ClusterCatalogItemDetailPage;
