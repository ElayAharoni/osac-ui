import { Content } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useTranslation } from '../../hooks/useTranslation';
import {
  type CatalogItem,
  formatCatalogFieldDefault,
  formatCatalogFieldValidationSummary,
} from '../catalog/catalogItemDisplay';
import { catalogItemFieldDefinitions } from '../catalogProvision/catalogFieldDefinition';

interface CatalogItemFieldDefinitionsTabProps {
  catalogItem: CatalogItem;
}

const CatalogItemFieldDefinitionsTab = ({ catalogItem }: CatalogItemFieldDefinitionsTabProps) => {
  const { t } = useTranslation();
  const fieldDefinitions = catalogItemFieldDefinitions(catalogItem);

  if (fieldDefinitions.length === 0) {
    return (
      <Content component="p">
        {t('No field definitions have been configured for this catalog item.')}
      </Content>
    );
  }

  return (
    <Table aria-label={t('Field definitions')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Path')}</Th>
          <Th>{t('Display Name')}</Th>
          <Th>{t('Editable')}</Th>
          <Th>{t('Default Value')}</Th>
          <Th>{t('Validation Constraints')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {fieldDefinitions.map((def) => (
          <Tr key={def.path}>
            <Td dataLabel={t('Path')}>{def.path}</Td>
            <Td dataLabel={t('Display Name')}>{def.displayName || '—'}</Td>
            <Td dataLabel={t('Editable')}>{def.editable ? t('Yes') : t('No')}</Td>
            <Td dataLabel={t('Default Value')}>{formatCatalogFieldDefault(def)}</Td>
            <Td dataLabel={t('Validation Constraints')}>
              {formatCatalogFieldValidationSummary(def, t)}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default CatalogItemFieldDefinitionsTab;
