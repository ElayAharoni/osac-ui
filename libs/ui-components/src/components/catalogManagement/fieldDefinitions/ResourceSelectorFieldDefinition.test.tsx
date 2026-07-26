import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { ResourceSelectorFieldDefinition } from './ResourceSelectorFieldDefinition';
import { EMPTY_LABELED_RESOURCE_REF } from '../../Form/labeledResourceRef';

const options = [
  { value: 'm5.large', label: 'm5.large' },
  { value: 'm5.xlarge', label: 'm5.xlarge' },
];

interface Values {
  fieldDefinitions: {
    instance_type: { editable: boolean; default: { value: string; label: string } };
  };
}

const renderField = (initialValues: Values, isLoading = false) => {
  render(
    <Formik initialValues={initialValues} onSubmit={() => undefined}>
      {({ values }) => (
        <>
          <ResourceSelectorFieldDefinition
            path="instance_type"
            label="Instance Type"
            fieldId="instance-type"
            options={options}
            isLoading={isLoading}
          />
          <output aria-label="default-value">
            {values.fieldDefinitions.instance_type.default.value}
          </output>
        </>
      )}
    </Formik>,
  );
};

describe('ResourceSelectorFieldDefinition', () => {
  it('renders the provided options', async () => {
    const user = userEvent.setup();
    renderField({
      fieldDefinitions: { instance_type: { editable: true, default: EMPTY_LABELED_RESOURCE_REF } },
    });

    await user.click(screen.getByLabelText(/^Default value/));

    expect(screen.getByRole('option', { name: 'm5.large' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'm5.xlarge' })).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    renderField(
      {
        fieldDefinitions: {
          instance_type: { editable: true, default: EMPTY_LABELED_RESOURCE_REF },
        },
      },
      true,
    );

    expect(screen.getByLabelText(/^Default value/)).toHaveTextContent('Loading...');
  });

  it('updates Formik when an option is selected', async () => {
    const user = userEvent.setup();
    renderField({
      fieldDefinitions: { instance_type: { editable: true, default: EMPTY_LABELED_RESOURCE_REF } },
    });

    await user.click(screen.getByLabelText(/^Default value/));
    await user.click(screen.getByRole('option', { name: 'm5.xlarge' }));

    expect(screen.getByLabelText('default-value')).toHaveTextContent('m5.xlarge');
  });
});
