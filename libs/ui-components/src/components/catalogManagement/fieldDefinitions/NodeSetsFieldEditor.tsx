import { useMemo } from 'react';
import {
  Alert,
  Flex,
  FlexItem,
  FormFieldGroup,
  FormFieldGroupHeader,
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

export interface NodeSetsFieldValue {
  /** Default node-set size per template node-set key — the only thing an admin can set; host type
   * and the set of keys are entirely determined by the selected cluster template. */
  sizeByKey: Record<string, string>;
  editable: boolean;
  sizeMin?: string;
  sizeMax?: string;
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
    <FieldDefinitionGroup label={t('Node Sets')} fieldId="node-sets" name={NODE_SETS_NAME}>
      <Stack hasGutter>
        {hostTypesError ? (
          <StackItem>
            <Alert variant="danger" isInline title={t('Could not load host types')}>
              {getErrorMessage(hostTypesError)}
            </Alert>
          </StackItem>
        ) : null}
        <StackItem>
          <FormFieldGroup
            header={
              <FormFieldGroupHeader
                titleText={{
                  text: (
                    <Title headingLevel="h5" size="md">
                      {t('Size constraints')}
                    </Title>
                  ),
                  id: 'node-sets-constraints-group',
                }}
                titleDescription={t(
                  'Applies to every node set below. When Node Sets is editable, tenants can choose a size within these bounds.',
                )}
              />
            }
          >
            <Flex gap={{ default: 'gapMd' }}>
              <FlexItem flex={{ default: 'flex_1' }}>
                <InputField
                  name={`${NODE_SETS_NAME}.sizeMin`}
                  label={t('Minimum size (optional)')}
                  fieldId="node-sets-size-min"
                  type="number"
                />
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <InputField
                  name={`${NODE_SETS_NAME}.sizeMax`}
                  label={t('Maximum size (optional)')}
                  fieldId="node-sets-size-max"
                  type="number"
                />
              </FlexItem>
            </Flex>
          </FormFieldGroup>
        </StackItem>
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
                          {t('Node set: {{key}}', { key })}
                        </Title>
                      ),
                      id: `node-set-group-${key}`,
                    }}
                    titleDescription={t('Host type: {{hostType}}', {
                      hostType: hostTypeLabel(hostTypeId),
                    })}
                  />
                }
              >
                <InputField
                  name={`${NODE_SETS_NAME}.sizeByKey.${key}`}
                  label={t('Nodes ({{key}})', { key })}
                  fieldId={`node-set-size-${key}`}
                  type="number"
                />
              </FormFieldGroup>
            </StackItem>
          );
        })}
      </Stack>
    </FieldDefinitionGroup>
  );
};
