import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { BooleanFieldDefinition } from './BooleanFieldDefinition';

interface Values {
  fieldDefinitions: {
    is_windows: { editable: boolean; default: boolean };
  };
}

const renderField = (initialValues: Values) => {
  render(
    <Formik initialValues={initialValues} onSubmit={() => undefined}>
      {({ values }) => (
        <>
          <BooleanFieldDefinition path="is_windows" label="Is Windows" fieldId="is-windows" />
          <output aria-label="default-value">
            {String(values.fieldDefinitions.is_windows.default)}
          </output>
        </>
      )}
    </Formik>,
  );
};

describe('BooleanFieldDefinition', () => {
  it('reflects the initial default value', () => {
    renderField({ fieldDefinitions: { is_windows: { editable: true, default: true } } });

    expect(screen.getByRole('switch', { name: 'Default value' })).toBeChecked();
  });

  it('updates the default value in Formik state', async () => {
    const user = userEvent.setup();
    renderField({ fieldDefinitions: { is_windows: { editable: true, default: false } } });

    await user.click(screen.getByRole('switch', { name: 'Default value' }));

    expect(screen.getByLabelText('default-value')).toHaveTextContent('true');
  });

  it('renders an independent editable toggle', async () => {
    const user = userEvent.setup();
    renderField({ fieldDefinitions: { is_windows: { editable: false, default: false } } });

    await user.click(screen.getByRole('switch', { name: 'Editable' }));

    expect(screen.getByRole('switch', { name: 'Editable' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Default value' })).not.toBeChecked();
  });
});
