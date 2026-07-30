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
  template: { value: 'tmpl-1', label: 'Template One' },
  fieldDefinitions: {
    release_image: { editable: false, default: '' },
    node_sets: { entriesByKey: {}, editable: true },
  },
};

const templates = [{ id: 'tmpl-1', nodeSets: { workers: { hostType: 'small' } } }];

describe('ClusterConfigurationStep', () => {
  it('renders the release image and node sets fields for the selected template', () => {
    vi.mocked(hostTypesApi.useHostTypes).mockReturnValue({
      data: [{ id: 'small', title: 'Small' }],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hostTypesApi.useHostTypes>);

    renderWithProviders(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <ClusterConfigurationStep templates={templates} />
      </Formik>,
    );

    expect(screen.getByText('Release image')).toBeInTheDocument();
    expect(screen.getByText('Workers')).toBeInTheDocument();
    expect(screen.getByText('Host type: Small')).toBeInTheDocument();
  });

  it('prompts for a template when the selected template id has no match', () => {
    vi.mocked(hostTypesApi.useHostTypes).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hostTypesApi.useHostTypes>);

    renderWithProviders(
      <Formik
        initialValues={{ ...initialValues, template: { value: '', label: '' } }}
        onSubmit={() => undefined}
      >
        <ClusterConfigurationStep templates={templates} />
      </Formik>,
    );

    expect(screen.getByText('Select a template to configure node sets')).toBeInTheDocument();
  });
});
