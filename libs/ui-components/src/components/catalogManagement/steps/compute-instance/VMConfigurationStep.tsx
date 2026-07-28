import { ActionGroup, Button, FormFieldGroup, FormFieldGroupHeader } from '@patternfly/react-core';
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useFormikContext } from 'formik';

import { useInstanceTypes } from '../../../../api/v1/instance-types';
import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';
import { formatInstanceTypeOptionLabel } from '../../../vm/utils';
import { BooleanFieldDefinition } from '../../fieldDefinitions/BooleanFieldDefinition';
import { NumberFieldDefinition } from '../../fieldDefinitions/NumberFieldDefinition';
import { ResourceSelectorFieldDefinition } from '../../fieldDefinitions/ResourceSelectorFieldDefinition';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

const ADDITIONAL_DISKS_NAME = 'fieldDefinitions.additional_disks';

interface AdditionalDiskEntry {
  rowId: string;
}

interface VMConfigurationFormValues {
  fieldDefinitions: {
    additional_disks: AdditionalDiskEntry[];
  };
}

const AdditionalDisksFieldEditor = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<VMConfigurationFormValues>();
  const entries = values.fieldDefinitions.additional_disks;

  const addRow = () => {
    void setFieldValue(ADDITIONAL_DISKS_NAME, [...entries, { rowId: crypto.randomUUID() }]);
  };

  const removeRow = (rowIndex: number) => {
    void setFieldValue(
      ADDITIONAL_DISKS_NAME,
      entries.filter((_, index) => index !== rowIndex),
    );
  };

  return (
    <>
      {entries.map((entry, rowIndex) => (
        <FormFieldGroup
          key={entry.rowId}
          header={
            <FormFieldGroupHeader
              titleText={{
                text: t('Additional disk {{number}}', { number: rowIndex + 1 }),
                id: `additional-disk-group-${entry.rowId}`,
              }}
              actions={
                <Button
                  variant="plain"
                  aria-label={t('Remove additional disk')}
                  onClick={() => removeRow(rowIndex)}
                  icon={<MinusCircleIcon />}
                />
              }
            />
          }
        >
          <NumberFieldDefinition
            path={`additional_disks.${rowIndex}.size_gib`}
            label={t('Size (GiB)')}
            fieldId={`additional-disk-size-${entry.rowId}`}
          />
        </FormFieldGroup>
      ))}
      <ActionGroup>
        <Button variant="link" icon={<PlusCircleIcon />} onClick={addRow}>
          {t('Add additional disk')}
        </Button>
      </ActionGroup>
    </>
  );
};

export const VMConfigurationStep = () => {
  const { t } = useTranslation();
  const { data: instanceTypes = [], isLoading: instanceTypesLoading } = useInstanceTypes();

  return (
    <OsacForm>
      <ResourceSelectorFieldDefinition
        path="instance_type"
        label={t('Instance Type')}
        fieldId="instance-type"
        options={instanceTypes.map((instanceType) => ({
          value: instanceType.id,
          label: formatInstanceTypeOptionLabel(instanceType),
        }))}
        isLoading={instanceTypesLoading}
      />
      <NumberFieldDefinition path="cores" label={t('Cores')} fieldId="cores" />
      <NumberFieldDefinition path="memory_gib" label={t('Memory (GiB)')} fieldId="memory-gib" />
      <StringFieldDefinition path="image" label={t('Image')} fieldId="image" />
      <NumberFieldDefinition
        path="boot_disk.size_gib"
        label={t('Boot Disk Size (GiB)')}
        fieldId="boot-disk-size"
      />
      <AdditionalDisksFieldEditor />
      <StringFieldDefinition path="run_strategy" label={t('Run Strategy')} fieldId="run-strategy" />
      <StringFieldDefinition
        path="user_data"
        label={t('User Data')}
        fieldId="user-data"
        multiline
      />
      <BooleanFieldDefinition path="is_windows" label={t('Is Windows')} fieldId="is-windows" />
    </OsacForm>
  );
};
