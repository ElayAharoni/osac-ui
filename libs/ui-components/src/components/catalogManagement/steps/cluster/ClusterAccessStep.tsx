import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

export const ClusterAccessStep = () => {
  const { t } = useTranslation();

  return (
    <OsacForm>
      <StringFieldDefinition
        path="ssh_public_key"
        label={t('SSH public key')}
        fieldId="ssh-public-key"
        multiline
      />
      <StringFieldDefinition
        path="pull_secret"
        label={t('Pull secret')}
        fieldId="pull-secret"
        multiline
      />
    </OsacForm>
  );
};
