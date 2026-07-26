import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { BMConfigurationStep } from './BMConfigurationStep';
import { renderWithProviders } from '../../../../test-utils/TestProviders';

const initialValues = {
  fieldDefinitions: {
    run_strategy: { editable: true, default: 'ALWAYS' },
    user_data: { editable: true, default: '' },
  },
};

describe('BMConfigurationStep', () => {
  it('renders the run strategy and user data fields', () => {
    renderWithProviders(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <BMConfigurationStep />
      </Formik>,
    );

    expect(screen.getByText('Run Strategy')).toBeInTheDocument();
    expect(screen.getByText('User Data')).toBeInTheDocument();
  });
});
