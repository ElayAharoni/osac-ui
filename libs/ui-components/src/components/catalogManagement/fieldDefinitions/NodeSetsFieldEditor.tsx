import { useMemo } from 'react';
import {
  ActionGroup,
  Button,
  FormFieldGroup,
  FormFieldGroupHeader,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useFormikContext } from 'formik';

import { hostTypeDisplayName, useHostTypes } from '../../../api/v1/host-types';
import { useTranslation } from '../../../hooks/useTranslation';
import { InputField } from '../../Form/InputField';
import { EMPTY_LABELED_RESOURCE_REF } from '../../Form/labeledResourceRef';
import { SelectField } from '../../Form/SelectField';
import { SwitchField } from '../../Form/SwitchField';

const NODE_SETS_NAME = 'fieldDefinitions.node_sets';

export interface NodeSetEntry {
  rowId: string;
  hostType: { value: string; label: string };
  size: string;
}

export interface NodeSetsFieldValue {
  entries: NodeSetEntry[];
  editable: boolean;
  allowAddRemove: boolean;
  sizeMin?: string;
  sizeMax?: string;
}

interface NodeSetsFormValues {
  fieldDefinitions: {
    node_sets: {
      entries: NodeSetEntry[];
    };
  };
}

const createEmptyEntry = (rowId: string): NodeSetEntry => ({
  rowId,
  hostType: EMPTY_LABELED_RESOURCE_REF,
  size: '',
});

export const NodeSetsFieldEditor = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<NodeSetsFormValues>();
  const { data: hostTypes = [], isLoading: hostTypesLoading } = useHostTypes();
  const entries = values.fieldDefinitions.node_sets.entries;

  const selectedHostTypeIds = useMemo(
    () => new Set(entries.map((entry) => entry.hostType.value.trim()).filter(Boolean)),
    [entries],
  );

  const hostTypeOptionsForRow = (rowIndex: number) => {
    const currentHostTypeId = entries[rowIndex]?.hostType.value.trim() ?? '';
    return hostTypes.map((hostType) => ({
      value: hostType.id,
      label: hostTypeDisplayName(hostType),
      isDisabled: selectedHostTypeIds.has(hostType.id) && hostType.id !== currentHostTypeId,
    }));
  };

  const addRow = () => {
    void setFieldValue(`${NODE_SETS_NAME}.entries`, [
      ...entries,
      createEmptyEntry(crypto.randomUUID()),
    ]);
  };

  const removeRow = (rowIndex: number) => {
    void setFieldValue(
      `${NODE_SETS_NAME}.entries`,
      entries.filter((_, index) => index !== rowIndex),
    );
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <SwitchField
          name={`${NODE_SETS_NAME}.editable`}
          label={t('Editable')}
          fieldId="node-sets-editable"
        />
        <SwitchField
          name={`${NODE_SETS_NAME}.allowAddRemove`}
          label={t('Allow add/remove')}
          fieldId="node-sets-allow-add-remove"
        />
      </StackItem>
      <StackItem>
        <InputField
          name={`${NODE_SETS_NAME}.sizeMin`}
          label={t('Minimum size (optional)')}
          fieldId="node-sets-size-min"
          type="number"
        />
        <InputField
          name={`${NODE_SETS_NAME}.sizeMax`}
          label={t('Maximum size (optional)')}
          fieldId="node-sets-size-max"
          type="number"
        />
      </StackItem>
      {entries.map((entry, rowIndex) => (
        <StackItem key={entry.rowId}>
          <FormFieldGroup
            header={
              <FormFieldGroupHeader
                titleText={{
                  text: t('Node set {{number}}', { number: rowIndex + 1 }),
                  id: `node-set-group-${entry.rowId}`,
                }}
                actions={
                  rowIndex > 0 ? (
                    <Button
                      variant="plain"
                      aria-label={t('Remove node set')}
                      onClick={() => removeRow(rowIndex)}
                      icon={<MinusCircleIcon />}
                    />
                  ) : undefined
                }
              />
            }
          >
            <SelectField
              name={`${NODE_SETS_NAME}.entries.${rowIndex}.hostType`}
              label={t('Host type')}
              fieldId={`node-set-host-type-${entry.rowId}`}
              options={hostTypeOptionsForRow(rowIndex)}
              isLoading={hostTypesLoading}
              placeholder={t('Select host type')}
            />
            <InputField
              name={`${NODE_SETS_NAME}.entries.${rowIndex}.size`}
              label={t('Nodes')}
              fieldId={`node-set-size-${entry.rowId}`}
              type="number"
            />
          </FormFieldGroup>
        </StackItem>
      ))}
      <StackItem>
        <ActionGroup>
          <Button
            variant="link"
            icon={<PlusCircleIcon />}
            onClick={addRow}
            isDisabled={hostTypesLoading}
          >
            {t('Add node set')}
          </Button>
        </ActionGroup>
      </StackItem>
    </Stack>
  );
};
