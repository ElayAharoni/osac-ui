import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import { VMConfigurationStep } from './VMConfigurationStep';
import * as instanceTypesApi from '../../../../api/v1/instance-types';
import { renderWithProviders } from '../../../../test-utils/TestProviders';

vi.mock('../../../../api/v1/instance-types', () => ({ useInstanceTypes: vi.fn() }));

const initialValues = {
  fieldDefinitions: {
    instance_type: { editable: false, default: { value: '', label: '' } },
    image: { editable: false, default: '' },
    boot_disk: { size_gib: { editable: false, default: '' } },
    additional_disks: [] as { rowId: string; sizeGib: string }[],
    run_strategy: { editable: true, default: 'Always' },
    user_data: { editable: true, default: '' },
    is_windows: { editable: true, default: false },
  },
};

describe('VMConfigurationStep', () => {
  it('renders all configuration fields', () => {
    vi.mocked(instanceTypesApi.useInstanceTypes).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof instanceTypesApi.useInstanceTypes>);

    renderWithProviders(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <VMConfigurationStep />
      </Formik>,
    );

    expect(screen.getByText('Instance Type')).toBeInTheDocument();
    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByText('Boot Disk Size (GiB)')).toBeInTheDocument();
    expect(screen.getByText('Run Strategy')).toBeInTheDocument();
    expect(screen.getByText('User Data')).toBeInTheDocument();
    expect(screen.getByText('Is Windows')).toBeInTheDocument();
  });

  it('adds and removes additional disk entries', async () => {
    vi.mocked(instanceTypesApi.useInstanceTypes).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof instanceTypesApi.useInstanceTypes>);
    const user = userEvent.setup();

    renderWithProviders(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        {({ values }) => (
          <>
            <VMConfigurationStep />
            <output aria-label="disk-count">
              {values.fieldDefinitions.additional_disks.length}
            </output>
          </>
        )}
      </Formik>,
    );

    await user.click(screen.getByRole('button', { name: 'Add additional disk' }));
    expect(screen.getByLabelText('disk-count')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: 'Remove additional disk' }));
    expect(screen.getByLabelText('disk-count')).toHaveTextContent('0');
  });
});
