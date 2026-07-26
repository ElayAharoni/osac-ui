import { FormFieldGroup, FormFieldGroupHeader } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation';
import { InputField } from '../../Form/InputField';
import { SwitchField } from '../../Form/SwitchField';

interface StringFieldDefinitionProps {
  path: string;
  label: string;
  fieldId: string;
  multiline?: boolean;
  helperText?: string;
}

export const StringFieldDefinition = ({
  path,
  label,
  fieldId,
  multiline,
  helperText,
}: StringFieldDefinitionProps) => {
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
        multiline={multiline}
        helperText={helperText}
      />
      <InputField
        name={`${name}.validation.pattern`}
        label={t('Validation pattern (optional)')}
        fieldId={`${fieldId}-pattern`}
        helperText={t('Regular expression the tenant-provided value must match.')}
      />
    </FormFieldGroup>
  );
};
