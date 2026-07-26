import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import { ClusterConfigurationStep } from './ClusterConfigurationStep';
import * as hostTypesApi from '../../../../api/v1/host-types';
import { renderWithProviders } from '../../../../test-utils/TestProviders';

vi.mock('../../../../api/v1/host-types', () => ({
  useHostTypes: vi.fn(),
  hostTypeDisplayName: (hostType: { id: string; title?: string }) => hostType.title ?? hostType.id,
}));

const initialValues = {
  fieldDefinitions: {
    release_image: { editable: false, default: '' },
    node_sets: {
      entries: [{ rowId: 'row-1', hostType: { value: '', label: '' }, size: '' }],
      editable: true,
      allowAddRemove: true,
    },
  },
};

describe('ClusterConfigurationStep', () => {
  it('renders the release image and node sets fields', () => {
    vi.mocked(hostTypesApi.useHostTypes).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hostTypesApi.useHostTypes>);

    renderWithProviders(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <ClusterConfigurationStep />
      </Formik>,
    );

    expect(screen.getByText('Release Image')).toBeInTheDocument();
    expect(screen.getByText('Node set 1')).toBeInTheDocument();
  });
});
