import { FieldDefinitionGroup } from './FieldDefinitionGroup';
import { useTranslation } from '../../../hooks/useTranslation';
import { InputField } from '../../Form/InputField';

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
    <FieldDefinitionGroup label={label} fieldId={fieldId} name={name}>
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
    </FieldDefinitionGroup>
  );
};
