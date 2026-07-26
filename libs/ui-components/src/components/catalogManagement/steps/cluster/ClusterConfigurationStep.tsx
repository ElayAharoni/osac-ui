import { useTranslation } from '../../../../hooks/useTranslation';
import { NodeSetsFieldEditor } from '../../fieldDefinitions/NodeSetsFieldEditor';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

export const ClusterConfigurationStep = () => {
  const { t } = useTranslation();

  return (
    <>
      <StringFieldDefinition
        path="release_image"
        label={t('Release Image')}
        fieldId="release-image"
      />
      <NodeSetsFieldEditor />
    </>
  );
};
