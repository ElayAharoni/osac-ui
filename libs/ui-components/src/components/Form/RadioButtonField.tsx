import { Flex, FlexItem, FormGroup, Radio } from '@patternfly/react-core';
import { useField } from 'formik';

import { getVisibleFieldError } from './fieldError';
import { useShowFieldValidationErrors } from './FieldValidationContext';
import { FormFieldHelper } from './FormFieldHelper';

export interface RadioButtonFieldOption {
  value: string;
  label: string;
}

interface RadioButtonFieldProps {
  name: string;
  label: string;
  fieldId: string;
  options: RadioButtonFieldOption[];
  isRequired?: boolean;
  isDisabled?: boolean;
  isInline?: boolean;
}

export const RadioButtonField = ({
  name,
  label,
  fieldId,
  options,
  isRequired = false,
  isDisabled = false,
  isInline = false,
}: RadioButtonFieldProps) => {
  const [field, meta] = useField<string | boolean>(name);
  const showValidationErrors = useShowFieldValidationErrors();
  const error = getVisibleFieldError(meta, showValidationErrors);
  const stringValue =
    field.value === true ? 'true' : field.value === false ? 'false' : String(field.value ?? '');

  return (
    <FormGroup
      label={label}
      fieldId={fieldId}
      isRequired={isRequired}
      role="radiogroup"
      isInline={isInline}
    >
      <Flex direction={{ default: isInline ? 'row' : 'column' }} gap={{ default: 'gapMd' }}>
        {options.map((option) => (
          <FlexItem key={option.value}>
            <Radio
              id={`${fieldId}-${option.value}`}
              name={name}
              label={option.label}
              isChecked={stringValue === option.value}
              isDisabled={isDisabled}
              onChange={() => {
                const parsed =
                  option.value === 'true' ? true : option.value === 'false' ? false : option.value;
                void field.onChange({ target: { name, value: parsed } });
              }}
              onBlur={field.onBlur}
            />
          </FlexItem>
        ))}
      </Flex>
      <FormFieldHelper error={error} fieldId={fieldId} />
    </FormGroup>
  );
};
