import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

export const VMAccessStep = () => {
  const { t } = useTranslation();

  return (
    <OsacForm>
      <StringFieldDefinition
        path="ssh_key"
        label={t('SSH public key')}
        fieldId="ssh-key"
        multiline
      />
    </OsacForm>
  );
};
