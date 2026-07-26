import { useTranslation } from '../../../../hooks/useTranslation';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

export const BMAccessStep = () => {
  const { t } = useTranslation();

  return (
    <StringFieldDefinition
      path="ssh_public_key"
      label={t('SSH Public Key')}
      fieldId="ssh-public-key"
      multiline
    />
  );
};
