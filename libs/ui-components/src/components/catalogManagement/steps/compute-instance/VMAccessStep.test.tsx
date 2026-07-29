import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { VMAccessStep } from './VMAccessStep';
import { renderWithProviders } from '../../../../test-utils/TestProviders';

const initialValues = {
  fieldDefinitions: {
    ssh_key: { editable: true, default: '' },
  },
};

describe('VMAccessStep', () => {
  it('renders the SSH public key field', () => {
    renderWithProviders(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <VMAccessStep />
      </Formik>,
    );

    expect(screen.getByText('SSH public key')).toBeInTheDocument();
  });
});
