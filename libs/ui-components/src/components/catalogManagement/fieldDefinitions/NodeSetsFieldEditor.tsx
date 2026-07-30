import { useMemo } from 'react';
import {
  Alert,
  Flex,
  FlexItem,
  FormFieldGroup,
  FormFieldGroupHeader,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import { FieldDefinitionGroup } from './FieldDefinitionGroup';
import { hostTypeDisplayName, useHostTypes } from '../../../api/v1/host-types';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import { InputField } from '../../Form/InputField';

const NODE_SETS_NAME = 'fieldDefinitions.node_sets';

export interface NodeSetEntry {
  default: string;
  min?: string;
  max?: string;
}

export interface NodeSetsFieldValue {
  /** One entry per template node-set key — the only thing an admin can set; host type and the set
   * of keys are entirely determined by the selected cluster template. */
  entriesByKey: Record<string, NodeSetEntry>;
  editable: boolean;
}

/** The subset of `ClusterTemplate` (public or private — both are structurally compatible here) that
 * this editor needs. */
export interface NodeSetsTemplateLike {
  nodeSets: Record<string, { hostType: string }>;
}

interface NodeSetsFieldEditorProps {
  /**
   * The cluster template selected in the General step. fulfillment-service validates that a
   * cluster's `node_sets` map keys and host types exactly match the template's own `node_sets` —
   * admins can only provide a default `size` per template-defined node set, not add, remove, or
   * repoint its host type (see fulfillment-service's `PrivateClustersServer.validateNodeSets`).
   */
  template: NodeSetsTemplateLike | undefined;
}

export const NodeSetsFieldEditor = ({ template }: NodeSetsFieldEditorProps) => {
  const { t } = useTranslation();
  const {
    data: hostTypes = [],
    isLoading: hostTypesLoading,
    error: hostTypesError,
  } = useHostTypes();

  const hostTypeById = useMemo(
    () => new Map(hostTypes.map((hostType) => [hostType.id, hostType])),
    [hostTypes],
  );

  const templateNodeSetKeys = useMemo(
    () => Object.keys(template?.nodeSets ?? {}).sort(),
    [template],
  );

  // Template node-set keys are free-form (e.g. "workers", "masters") — capitalize for display only.
  const nodeSetDisplayName = (key: string): string => key.charAt(0).toUpperCase() + key.slice(1);

  const hostTypeLabel = (hostTypeId: string): string => {
    if (!hostTypeId) {
      return t('Unknown');
    }
    const hostType = hostTypeById.get(hostTypeId);
    if (hostType) {
      return hostTypeDisplayName(hostType);
    }
    return hostTypesLoading ? t('Loading...') : hostTypeId;
  };

  if (!template) {
    return <Alert variant="info" isInline title={t('Select a template to configure node sets')} />;
  }

  if (templateNodeSetKeys.length === 0) {
    return <Alert variant="info" isInline title={t('This template has no node sets defined')} />;
  }

  return (
    <FieldDefinitionGroup label={t('Node sets')} fieldId="node-sets" name={NODE_SETS_NAME}>
      <Stack hasGutter>
        {hostTypesError ? (
          <StackItem>
            <Alert variant="danger" isInline title={t('Could not load host types')}>
              {getErrorMessage(hostTypesError)}
            </Alert>
          </StackItem>
        ) : null}
        {templateNodeSetKeys.map((key) => {
          const hostTypeId = template.nodeSets[key]?.hostType ?? '';
          return (
            <StackItem key={key}>
              <FormFieldGroup
                header={
                  <FormFieldGroupHeader
                    titleText={{
                      text: (
                        <Title headingLevel="h5" size="md">
                          {nodeSetDisplayName(key)}
                        </Title>
                      ),
                      id: `node-set-group-${key}`,
                    }}
                    actions={
                      <Label color="blue">
                        {t('Host type: {{hostType}}', { hostType: hostTypeLabel(hostTypeId) })}
                      </Label>
                    }
                  />
                }
              >
                <Flex gap={{ default: 'gapMd' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <InputField
                      name={`${NODE_SETS_NAME}.entriesByKey.${key}.default`}
                      label={t('Default nodes')}
                      fieldId={`node-set-default-${key}`}
                      type="number"
                    />
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <InputField
                      name={`${NODE_SETS_NAME}.entriesByKey.${key}.min`}
                      label={t('Minimum nodes')}
                      fieldId={`node-set-min-${key}`}
                      type="number"
                    />
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <InputField
                      name={`${NODE_SETS_NAME}.entriesByKey.${key}.max`}
                      label={t('Maximum nodes')}
                      fieldId={`node-set-max-${key}`}
                      type="number"
                    />
                  </FlexItem>
                </Flex>
              </FormFieldGroup>
            </StackItem>
          );
        })}
      </Stack>
    </FieldDefinitionGroup>
  );
};
