import { FormFieldGroup, FormFieldGroupHeader } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation';
import { SelectField, type SelectFieldOption } from '../../Form/SelectField';
import { SwitchField } from '../../Form/SwitchField';

interface ResourceSelectorFieldDefinitionProps {
  path: string;
  label: string;
  fieldId: string;
  options: SelectFieldOption[];
  isLoading?: boolean;
}

export const ResourceSelectorFieldDefinition = ({
  path,
  label,
  fieldId,
  options,
  isLoading,
}: ResourceSelectorFieldDefinitionProps) => {
  const { t } = useTranslation();
  const name = `fieldDefinitions.${path}`;

  return (
    <FormFieldGroup
      header={<FormFieldGroupHeader titleText={{ text: label, id: `${fieldId}-group` }} />}
    >
      <SwitchField
        name={`${name}.editable`}
        label={t('Editable')}
        fieldId={`${fieldId}-editable`}
      />
      <SelectField
        name={`${name}.default`}
        label={t('Default value')}
        fieldId={`${fieldId}-default`}
        options={options}
        isLoading={isLoading}
        placeholder={t('Select a value')}
      />
    </FormFieldGroup>
  );
};
