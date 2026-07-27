import { FieldDefinitionGroup } from './FieldDefinitionGroup';
import { useTranslation } from '../../../hooks/useTranslation';
import { InputField } from '../../Form/InputField';

interface NumberFieldDefinitionProps {
  path: string;
  label: string;
  fieldId: string;
}

export const NumberFieldDefinition = ({ path, label, fieldId }: NumberFieldDefinitionProps) => {
  const { t } = useTranslation();
  const name = `fieldDefinitions.${path}`;

  return (
    <FieldDefinitionGroup label={label} fieldId={fieldId} name={name}>
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
    </FieldDefinitionGroup>
  );
};
