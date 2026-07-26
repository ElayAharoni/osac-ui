import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { StringFieldDefinition } from './StringFieldDefinition';

interface Values {
  fieldDefinitions: {
    release_image: { editable: boolean; default: string; validation?: { pattern?: string } };
  };
}

const renderField = (initialValues: Values) => {
  render(
    <Formik initialValues={initialValues} onSubmit={() => undefined}>
      {({ values }) => (
        <>
          <StringFieldDefinition
            path="release_image"
            label="Release Image"
            fieldId="release-image"
          />
          <output aria-label="editable-value">
            {String(values.fieldDefinitions.release_image.editable)}
          </output>
          <output aria-label="default-value">
            {values.fieldDefinitions.release_image.default}
          </output>
          <output aria-label="pattern-value">
            {values.fieldDefinitions.release_image.validation?.pattern ?? ''}
          </output>
        </>
      )}
    </Formik>,
  );
};

describe('StringFieldDefinition', () => {
  it('renders the field path as the group heading', () => {
    renderField({
      fieldDefinitions: { release_image: { editable: false, default: 'quay.io/x:latest' } },
    });

    expect(screen.getByText('Release Image')).toBeInTheDocument();
  });

  it('reflects the initial editable and default values', () => {
    renderField({
      fieldDefinitions: { release_image: { editable: false, default: 'quay.io/x:latest' } },
    });

    expect(screen.getByRole('switch', { name: 'Editable' })).not.toBeChecked();
    expect(screen.getByLabelText('Default value')).toHaveValue('quay.io/x:latest');
  });

  it('updates the editable toggle in Formik state', async () => {
    const user = userEvent.setup();
    renderField({ fieldDefinitions: { release_image: { editable: false, default: '' } } });

    await user.click(screen.getByRole('switch', { name: 'Editable' }));

    expect(screen.getByLabelText('editable-value')).toHaveTextContent('true');
  });

  it('updates the default value in Formik state', async () => {
    const user = userEvent.setup();
    renderField({ fieldDefinitions: { release_image: { editable: false, default: '' } } });

    await user.type(screen.getByLabelText('Default value'), 'quay.io/y:latest');

    expect(screen.getByLabelText('default-value')).toHaveTextContent('quay.io/y:latest');
  });

  it('updates the validation pattern in Formik state', async () => {
    const user = userEvent.setup();
    renderField({ fieldDefinitions: { release_image: { editable: true, default: '' } } });

    await user.type(screen.getByLabelText(/Validation pattern/), 'abc123');

    expect(screen.getByLabelText('pattern-value')).toHaveTextContent('abc123');
  });
});
