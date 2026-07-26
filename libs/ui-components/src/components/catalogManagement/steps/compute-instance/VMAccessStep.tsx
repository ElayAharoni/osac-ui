import { useTranslation } from '../../../../hooks/useTranslation';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

export const VMAccessStep = () => {
  const { t } = useTranslation();

  return <StringFieldDefinition path="ssh_key" label={t('SSH Key')} fieldId="ssh-key" multiline />;
};
