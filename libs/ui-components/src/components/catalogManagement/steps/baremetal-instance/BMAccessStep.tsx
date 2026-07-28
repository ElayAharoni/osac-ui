import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

export const BMAccessStep = () => {
  const { t } = useTranslation();

  return (
    <OsacForm>
      <StringFieldDefinition
        path="ssh_public_key"
        label={t('SSH Public Key')}
        fieldId="ssh-public-key"
        multiline
      />
    </OsacForm>
  );
};
