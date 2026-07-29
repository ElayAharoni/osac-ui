import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { BMAccessStep } from './BMAccessStep';
import { renderWithProviders } from '../../../../test-utils/TestProviders';

const initialValues = {
  fieldDefinitions: {
    ssh_public_key: { editable: true, default: '' },
  },
};

describe('BMAccessStep', () => {
  it('renders the SSH public key field', () => {
    renderWithProviders(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <BMAccessStep />
      </Formik>,
    );

    expect(screen.getByText('SSH public key')).toBeInTheDocument();
  });
});
