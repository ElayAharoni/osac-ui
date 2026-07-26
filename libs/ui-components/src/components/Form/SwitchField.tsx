import { FormGroup, Switch } from '@patternfly/react-core';
import { useField } from 'formik';

interface SwitchFieldProps {
  name: string;
  label: string;
  fieldId: string;
  isDisabled?: boolean;
}

export const SwitchField = ({ name, label, fieldId, isDisabled = false }: SwitchFieldProps) => {
  const [field, , helpers] = useField<boolean>(name);

  return (
    <FormGroup fieldId={fieldId}>
      <Switch
        id={fieldId}
        label={label}
        isChecked={Boolean(field.value)}
        isDisabled={isDisabled}
        onChange={(_event, checked) => {
          void helpers.setValue(checked);
        }}
      />
    </FormGroup>
  );
};
