import type { ReactNode } from 'react';
import { FormFieldGroup, FormFieldGroupHeader } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation';
import { SwitchField } from '../../Form/SwitchField';

interface FieldDefinitionGroupProps {
  label: string;
  fieldId: string;
  /** `fieldDefinitions.<path>` name prefix, shared with the "Editable" switch below and the caller's own fields. */
  name: string;
  children: ReactNode;
}

/** Shared `FormFieldGroup` scaffolding for field-definition editors: group header plus the "Editable" switch every field kind exposes, ahead of the field-specific inputs passed as children. */
export const FieldDefinitionGroup = ({
  label,
  fieldId,
  name,
  children,
}: FieldDefinitionGroupProps) => {
  const { t } = useTranslation();

  return (
    <FormFieldGroup
      header={<FormFieldGroupHeader titleText={{ text: label, id: `${fieldId}-group` }} />}
    >
      <SwitchField
        name={`${name}.editable`}
        label={t('Editable')}
        fieldId={`${fieldId}-editable`}
      />
      {children}
    </FormFieldGroup>
  );
};
