import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { SwitchField } from './SwitchField';

const renderSwitch = (initialValue: boolean, isDisabled = false) => {
  render(
    <Formik initialValues={{ enabled: initialValue }} onSubmit={() => undefined}>
      {({ values }) => (
        <>
          <SwitchField name="enabled" label="Enabled" fieldId="enabled" isDisabled={isDisabled} />
          <output aria-label="formik-value">{String(values.enabled)}</output>
        </>
      )}
    </Formik>,
  );
};

describe('SwitchField', () => {
  it('reflects the initial Formik value', () => {
    renderSwitch(true);

    expect(screen.getByRole('switch', { name: 'Enabled' })).toBeChecked();
  });

  it('updates Formik when toggled on', async () => {
    const user = userEvent.setup();
    renderSwitch(false);

    await user.click(screen.getByRole('switch', { name: 'Enabled' }));

    expect(screen.getByLabelText('formik-value')).toHaveTextContent('true');
  });

  it('updates Formik when toggled off', async () => {
    const user = userEvent.setup();
    renderSwitch(true);

    await user.click(screen.getByRole('switch', { name: 'Enabled' }));

    expect(screen.getByLabelText('formik-value')).toHaveTextContent('false');
  });

  it('does not respond to clicks when disabled', async () => {
    const user = userEvent.setup();
    renderSwitch(false, true);

    await user.click(screen.getByRole('switch', { name: 'Enabled' }));

    expect(screen.getByLabelText('formik-value')).toHaveTextContent('false');
  });
});
