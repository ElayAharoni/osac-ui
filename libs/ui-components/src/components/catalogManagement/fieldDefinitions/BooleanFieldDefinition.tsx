import { FormFieldGroup, FormFieldGroupHeader } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation';
import { SwitchField } from '../../Form/SwitchField';

interface BooleanFieldDefinitionProps {
  path: string;
  label: string;
  fieldId: string;
}

export const BooleanFieldDefinition = ({ path, label, fieldId }: BooleanFieldDefinitionProps) => {
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
      <SwitchField
        name={`${name}.default`}
        label={t('Default value')}
        fieldId={`${fieldId}-default`}
      />
    </FormFieldGroup>
  );
};
