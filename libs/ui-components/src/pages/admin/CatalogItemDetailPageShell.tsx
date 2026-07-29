import type { CatalogItem } from '../../components/catalog/catalogItemDisplay';
import CatalogItemDetails from '../../components/catalogManagement/CatalogItemDetails';
import type { CatalogItemDetailKind } from '../../components/catalogManagement/CatalogItemProvisionedResourcesTab';
import { ResourceDetailsPageError } from '../../components/Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../../components/Resource/ResourceDetailsPageLoading';
import { useTranslation } from '../../hooks/useTranslation';
import type { DemoShellRole } from '../../shellTypes';

interface CatalogItemDetailPageShellProps {
  catalogItem: CatalogItem | undefined;
  kind: CatalogItemDetailKind;
  role: DemoShellRole;
  templateName?: string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}

/** Shared loading/error/not-found/success shell for the three kind-specific catalog item detail
 * pages — each page owns its own role-based hook selection, then delegates rendering here. */
const CatalogItemDetailPageShell = ({
  catalogItem,
  kind,
  role,
  templateName,
  isLoading,
  isError,
  error,
  onRetry,
}: CatalogItemDetailPageShellProps) => {
  const { t } = useTranslation();

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
        onRetry={onRetry}
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
      kind={kind}
      role={role}
      templateName={templateName}
    />
  );
};

export default CatalogItemDetailPageShell;
