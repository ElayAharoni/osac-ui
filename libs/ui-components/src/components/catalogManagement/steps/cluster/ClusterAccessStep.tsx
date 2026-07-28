import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

export const ClusterAccessStep = () => {
  const { t } = useTranslation();

  return (
    <OsacForm>
      <StringFieldDefinition
        path="ssh_public_key"
        label={t('SSH Public Key')}
        fieldId="ssh-public-key"
        multiline
      />
      <StringFieldDefinition
        path="pull_secret"
        label={t('Pull Secret')}
        fieldId="pull-secret"
        multiline
      />
    </OsacForm>
  );
};
