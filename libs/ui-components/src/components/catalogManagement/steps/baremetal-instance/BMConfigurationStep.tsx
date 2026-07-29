import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

export const BMConfigurationStep = () => {
  const { t } = useTranslation();

  return (
    <OsacForm>
      <StringFieldDefinition path="run_strategy" label={t('Run strategy')} fieldId="run-strategy" />
      <StringFieldDefinition
        path="user_data"
        label={t('User data')}
        fieldId="user-data"
        multiline
      />
    </OsacForm>
  );
};
