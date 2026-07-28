import { useState } from 'react';
import {
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';

import CatalogItemDetailActionButtons from './CatalogItemDetailActionButtons';
import CatalogItemFieldDefinitionsTab from './CatalogItemFieldDefinitionsTab';
import CatalogItemOverviewTab from './CatalogItemOverviewTab';
import type { CatalogItemDetailKind } from './CatalogItemProvisionedResourcesTab';
import CatalogItemProvisionedResourcesTab from './CatalogItemProvisionedResourcesTab';
import CatalogItemStatusLabel from './CatalogItemStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import type { DemoShellRole } from '../../shellTypes';
import type { CatalogItem } from '../catalog/catalogItemDisplay';
import { ResourceDetailHeader } from '../Resource/ResourceDetailHeader';

interface CatalogItemDetailsProps {
  catalogItem: CatalogItem;
  kind: CatalogItemDetailKind;
  role: DemoShellRole;
  templateName?: string;
}

const OVERVIEW_TAB_ID = 'catalog-item-detail-tab-overview';
const FIELD_DEFINITIONS_TAB_ID = 'catalog-item-detail-tab-field-definitions';
const PROVISIONED_RESOURCES_TAB_ID = 'catalog-item-detail-tab-provisioned-resources';

const CatalogItemDetails = ({ catalogItem, kind, role, templateName }: CatalogItemDetailsProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const editHref = `/admin/catalog/${kind}/${catalogItem.id}/edit`;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <Flex
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignItems={{ default: 'alignItemsFlexStart' }}
              flexWrap={{ default: 'wrap' }}
              spaceItems={{ default: 'spaceItemsMd' }}
            >
              <FlexItem>
                <ResourceDetailHeader
                  parentTo="/admin/catalog"
                  parentLabel={t('Catalog management')}
                  resourceName={catalogItem.title}
                  titleAddon={<CatalogItemStatusLabel published={catalogItem.published} />}
                />
              </FlexItem>
              <FlexItem>
                <CatalogItemDetailActionButtons
                  catalogItem={catalogItem}
                  role={role}
                  editHref={editHref}
                  onDeleteClick={() => {}}
                  onTogglePublish={() => {}}
                />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Tabs
              id="catalog-item-detail-tabs"
              activeKey={activeTab}
              onSelect={(_event, key) => setActiveTab(Number(key))}
            >
              <Tab
                eventKey={0}
                title={<TabTitleText>{t('Overview')}</TabTitleText>}
                tabContentId={OVERVIEW_TAB_ID}
              />
              <Tab
                eventKey={1}
                title={<TabTitleText>{t('Field Definitions')}</TabTitleText>}
                tabContentId={FIELD_DEFINITIONS_TAB_ID}
              />
              <Tab
                eventKey={2}
                title={<TabTitleText>{t('Provisioned Resources')}</TabTitleText>}
                tabContentId={PROVISIONED_RESOURCES_TAB_ID}
              />
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <TabContent
          eventKey={0}
          id={OVERVIEW_TAB_ID}
          activeKey={activeTab}
          hidden={activeTab !== 0}
        >
          <TabContentBody>
            <CatalogItemOverviewTab
              catalogItem={catalogItem}
              role={role}
              templateName={templateName}
            />
          </TabContentBody>
        </TabContent>
        <TabContent
          eventKey={1}
          id={FIELD_DEFINITIONS_TAB_ID}
          activeKey={activeTab}
          hidden={activeTab !== 1}
        >
          <TabContentBody>
            <CatalogItemFieldDefinitionsTab catalogItem={catalogItem} />
          </TabContentBody>
        </TabContent>
        <TabContent
          eventKey={2}
          id={PROVISIONED_RESOURCES_TAB_ID}
          activeKey={activeTab}
          hidden={activeTab !== 2}
        >
          <TabContentBody>
            <CatalogItemProvisionedResourcesTab catalogItemId={catalogItem.id} kind={kind} />
          </TabContentBody>
        </TabContent>
      </PageSection>
    </>
  );
};

export default CatalogItemDetails;
