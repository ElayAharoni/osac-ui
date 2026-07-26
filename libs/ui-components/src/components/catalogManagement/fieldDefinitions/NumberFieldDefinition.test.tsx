import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { NumberFieldDefinition } from './NumberFieldDefinition';

interface Values {
  fieldDefinitions: {
    cores: {
      editable: boolean;
      default: string;
      validation?: { minimum?: string; maximum?: string };
    };
  };
}

const renderField = (initialValues: Values) => {
  render(
    <Formik initialValues={initialValues} onSubmit={() => undefined}>
      {({ values }) => (
        <>
          <NumberFieldDefinition path="cores" label="Cores" fieldId="cores" />
          <output aria-label="default-value">{values.fieldDefinitions.cores.default}</output>
          <output aria-label="min-value">
            {values.fieldDefinitions.cores.validation?.minimum ?? ''}
          </output>
          <output aria-label="max-value">
            {values.fieldDefinitions.cores.validation?.maximum ?? ''}
          </output>
        </>
      )}
    </Formik>,
  );
};

describe('NumberFieldDefinition', () => {
  it('reflects the initial default value', () => {
    renderField({ fieldDefinitions: { cores: { editable: true, default: '4' } } });

    expect(screen.getByLabelText('Default value')).toHaveValue(4);
  });

  it('updates the default value in Formik state', async () => {
    const user = userEvent.setup();
    renderField({ fieldDefinitions: { cores: { editable: true, default: '' } } });

    await user.type(screen.getByLabelText('Default value'), '8');

    expect(screen.getByLabelText('default-value')).toHaveTextContent('8');
  });

  it('updates the minimum and maximum constraints in Formik state', async () => {
    const user = userEvent.setup();
    renderField({ fieldDefinitions: { cores: { editable: true, default: '' } } });

    await user.type(screen.getByLabelText(/Minimum/), '1');
    await user.type(screen.getByLabelText(/Maximum/), '16');

    expect(screen.getByLabelText('min-value')).toHaveTextContent('1');
    expect(screen.getByLabelText('max-value')).toHaveTextContent('16');
  });
});
