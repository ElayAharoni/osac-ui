import { Switch } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';

interface CatalogItemPublishToggleProps {
  published: boolean;
  isDisabled?: boolean;
  onChange: (next: boolean) => void;
}

const CatalogItemPublishToggle = ({
  published,
  isDisabled,
  onChange,
}: CatalogItemPublishToggleProps) => {
  const { t } = useTranslation();

  return (
    <Switch
      id="catalog-item-publish-toggle"
      label={published ? t('Published') : t('Unpublished')}
      isChecked={published}
      hasCheckIcon
      isDisabled={isDisabled}
      onChange={(_event, checked) => onChange(checked)}
    />
  );
};

export default CatalogItemPublishToggle;
