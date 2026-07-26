import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { ClusterNetworkingStep } from './ClusterNetworkingStep';
import { renderWithProviders } from '../../../../test-utils/TestProviders';

const initialValues = {
  fieldDefinitions: {
    network: {
      pod_cidr: { editable: true, default: '' },
      service_cidr: { editable: true, default: '' },
    },
  },
};

describe('ClusterNetworkingStep', () => {
  it('renders the pod CIDR and service CIDR fields', () => {
    renderWithProviders(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <ClusterNetworkingStep />
      </Formik>,
    );

    expect(screen.getByText('Pod CIDR')).toBeInTheDocument();
    expect(screen.getByText('Service CIDR')).toBeInTheDocument();
  });
});
