import { FieldDefinitionGroup } from './FieldDefinitionGroup';
import { useTranslation } from '../../../hooks/useTranslation';
import { SelectField, type SelectFieldOption } from '../../Form/SelectField';

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
    <FieldDefinitionGroup label={label} fieldId={fieldId} name={name}>
      <SelectField
        name={`${name}.default`}
        label={t('Default value')}
        fieldId={`${fieldId}-default`}
        options={options}
        isLoading={isLoading}
        placeholder={t('Select a value')}
      />
    </FieldDefinitionGroup>
  );
};
