import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { ClusterAccessStep } from './ClusterAccessStep';
import { renderWithProviders } from '../../../../test-utils/TestProviders';

const initialValues = {
  fieldDefinitions: {
    ssh_public_key: { editable: true, default: '' },
    pull_secret: { editable: true, default: '' },
  },
};

describe('ClusterAccessStep', () => {
  it('renders the SSH public key and pull secret fields', () => {
    renderWithProviders(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <ClusterAccessStep />
      </Formik>,
    );

    expect(screen.getByText('SSH public key')).toBeInTheDocument();
    expect(screen.getByText('Pull secret')).toBeInTheDocument();
  });
});
