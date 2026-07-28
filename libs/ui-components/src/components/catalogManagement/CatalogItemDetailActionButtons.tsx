import { useNavigate } from 'react-router-dom';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import PencilAltIcon from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import TrashIcon from '@patternfly/react-icons/dist/esm/icons/trash-icon';

import CatalogItemPublishToggle from './CatalogItemPublishToggle';
import { useTranslation } from '../../hooks/useTranslation';
import type { DemoShellRole } from '../../shellTypes';
import { type CatalogItem, catalogItemScope } from '../catalog/catalogItemDisplay';

interface CatalogItemDetailActionButtonsProps {
  catalogItem: CatalogItem;
  role: DemoShellRole;
  editHref: string;
  onDeleteClick: () => void;
  onTogglePublish: (next: boolean) => void;
}

const CatalogItemDetailActionButtons = ({
  catalogItem,
  role,
  editHref,
  onDeleteClick,
  onTogglePublish,
}: CatalogItemDetailActionButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scope = catalogItemScope(catalogItem, role);
  const isHiddenForTenantAdmin = role === 'tenantAdmin' && scope.level === 'general';

  if (isHiddenForTenantAdmin) {
    return null;
  }

  return (
    <Flex
      justifyContent={{ default: 'justifyContentFlexEnd' }}
      alignItems={{ default: 'alignItemsCenter' }}
      spaceItems={{ default: 'spaceItemsSm' }}
      flexWrap={{ default: 'wrap' }}
    >
      <FlexItem>
        <CatalogItemPublishToggle published={catalogItem.published} onChange={onTogglePublish} />
      </FlexItem>
      <FlexItem>
        <Button variant="primary" icon={<PencilAltIcon />} onClick={() => navigate(editHref)}>
          {t('Edit')}
        </Button>
      </FlexItem>
      <FlexItem>
        <Button variant="danger" icon={<TrashIcon />} onClick={onDeleteClick}>
          {t('Delete')}
        </Button>
      </FlexItem>
    </Flex>
  );
};

export default CatalogItemDetailActionButtons;
