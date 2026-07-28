import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

export const BMConfigurationStep = () => {
  const { t } = useTranslation();

  return (
    <OsacForm>
      <StringFieldDefinition path="run_strategy" label={t('Run Strategy')} fieldId="run-strategy" />
      <StringFieldDefinition
        path="user_data"
        label={t('User Data')}
        fieldId="user-data"
        multiline
      />
    </OsacForm>
  );
};
