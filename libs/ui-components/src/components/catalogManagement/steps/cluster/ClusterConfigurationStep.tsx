import { useFormikContext } from 'formik';

import { useTranslation } from '../../../../hooks/useTranslation';
import type { LabeledResourceRef } from '../../../Form/labeledResourceRef';
import OsacForm from '../../../Form/OsacForm';
import {
  NodeSetsFieldEditor,
  type NodeSetsTemplateLike,
} from '../../fieldDefinitions/NodeSetsFieldEditor';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

interface ClusterConfigurationStepProps {
  templates: ({ id: string } & NodeSetsTemplateLike)[];
}

interface ClusterConfigurationFormValues {
  template: LabeledResourceRef;
}

export const ClusterConfigurationStep = ({ templates }: ClusterConfigurationStepProps) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ClusterConfigurationFormValues>();
  const selectedTemplate = templates.find((template) => template.id === values.template.value);

  return (
    <OsacForm>
      <StringFieldDefinition
        path="release_image"
        label={t('Release Image')}
        fieldId="release-image"
      />
      <NodeSetsFieldEditor template={selectedTemplate} />
    </OsacForm>
  );
};
