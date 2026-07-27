import { FieldDefinitionGroup } from './FieldDefinitionGroup';
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
    <FieldDefinitionGroup label={label} fieldId={fieldId} name={name}>
      <SwitchField
        name={`${name}.default`}
        label={t('Default value')}
        fieldId={`${fieldId}-default`}
      />
    </FieldDefinitionGroup>
  );
};
