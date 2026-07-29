import {
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import type { TFunction } from 'i18next';

import CatalogItemScopeBadge from './CatalogItemScopeBadge';
import CatalogItemStatusLabel from './CatalogItemStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import type { DemoShellRole } from '../../shellTypes';
import { displayValue } from '../../utils/detailFormatters';
import { type CatalogItem, catalogItemScope } from '../catalog/catalogItemDisplay';
import SanitizedMarkdown from '../Primitives/SanitizedMarkdown';
import { Timestamp } from '../Primitives/Timestamp';

interface CatalogItemOverviewTabProps {
  catalogItem: CatalogItem;
  role: DemoShellRole;
  templateName?: string;
}

const catalogItemResourceTypeLabel = (item: CatalogItem, t: TFunction): string => {
  switch (item.$typeName) {
    case 'osac.public.v1.ClusterCatalogItem':
    case 'osac.private.v1.ClusterCatalogItem':
      return t('Cluster');
    case 'osac.public.v1.ComputeInstanceCatalogItem':
    case 'osac.private.v1.ComputeInstanceCatalogItem':
      return t('Virtual Machine');
    case 'osac.public.v1.BareMetalInstanceCatalogItem':
    case 'osac.private.v1.BareMetalInstanceCatalogItem':
      return t('Bare Metal');
    default: {
      const exhaustiveCheck: never = item;
      void exhaustiveCheck;
      return t('Unknown');
    }
  }
};

const CatalogItemOverviewTab = ({
  catalogItem,
  role,
  templateName,
}: CatalogItemOverviewTabProps) => {
  const { t } = useTranslation();
  const description = catalogItem.description;
  const hasDescription = Boolean(description?.trim());

  return (
    <Card>
      <CardBody>
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(catalogItem.title)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
            <DescriptionListDescription>
              {hasDescription && description ? (
                <SanitizedMarkdown>{description}</SanitizedMarkdown>
              ) : (
                displayValue()
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Resource type')}</DescriptionListTerm>
            <DescriptionListDescription>
              {catalogItemResourceTypeLabel(catalogItem, t)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Scope')}</DescriptionListTerm>
            <DescriptionListDescription>
              <CatalogItemScopeBadge scope={catalogItemScope(catalogItem, role)} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Template')}</DescriptionListTerm>
            <DescriptionListDescription>{displayValue(templateName)}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Publication status')}</DescriptionListTerm>
            <DescriptionListDescription>
              <CatalogItemStatusLabel published={catalogItem.published} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
            <DescriptionListDescription>
              <Timestamp value={catalogItem.metadata?.creationTimestamp} />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default CatalogItemOverviewTab;
