import { useParams } from 'react-router-dom';

import { useBareMetalInstanceCatalogItem } from '../../../api/v1/baremetal-instance';
import { usePrivateBareMetalInstanceCatalogItem } from '../../../api/v1/private/baremetal-instance-catalog-item';
import CatalogItemDetails from '../../../components/catalogManagement/CatalogItemDetails';
import { ResourceDetailsPageError } from '../../../components/Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../../../components/Resource/ResourceDetailsPageLoading';
import { useSession } from '../../../hooks/use-session';
import { useTranslation } from '../../../hooks/useTranslation';

const BareMetalInstanceCatalogItemDetailPage = () => {
  const { t } = useTranslation();
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
      kind="baremetal-instance"
      role={role}
      templateName={catalogItem.template}
    />
  );
};

export default BareMetalInstanceCatalogItemDetailPage;
