import { FormFieldGroup, FormFieldGroupHeader } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation';
import { InputField } from '../../Form/InputField';
import { SwitchField } from '../../Form/SwitchField';

interface NumberFieldDefinitionProps {
  path: string;
  label: string;
  fieldId: string;
}

export const NumberFieldDefinition = ({ path, label, fieldId }: NumberFieldDefinitionProps) => {
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
      <InputField
        name={`${name}.default`}
        label={t('Default value')}
        fieldId={`${fieldId}-default`}
        type="number"
      />
      <InputField
        name={`${name}.validation.minimum`}
        label={t('Minimum (optional)')}
        fieldId={`${fieldId}-min`}
        type="number"
      />
      <InputField
        name={`${name}.validation.maximum`}
        label={t('Maximum (optional)')}
        fieldId={`${fieldId}-max`}
        type="number"
      />
    </FormFieldGroup>
  );
};
