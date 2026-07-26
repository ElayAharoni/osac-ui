import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import { CatalogItemGeneralFields } from './CatalogItemGeneralFields';
import * as organizationApi from '../../api/v1/organization';
import * as projectsApi from '../../api/v1/projects';
import { SessionProvider } from '../../hooks/use-session';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('../../api/v1/organization', () => ({ useOrganizations: vi.fn() }));
vi.mock('../../api/v1/projects', () => ({ useProjects: vi.fn() }));

const asQueryResult = <T,>(data: T) =>
  ({ data, isLoading: false, error: null }) as unknown as ReturnType<
    typeof organizationApi.useOrganizations
  >;

const mockLists = () => {
  vi.mocked(organizationApi.useOrganizations).mockReturnValue(
    asQueryResult([{ id: 'acme', metadata: { name: 'Acme' } }]),
  );
  vi.mocked(projectsApi.useProjects).mockReturnValue(
    asQueryResult([{ id: 'proj-1', metadata: { name: 'Project One' } }]) as unknown as ReturnType<
      typeof projectsApi.useProjects
    >,
  );
};

interface Values {
  metadata: { name: string };
  description: string;
  template: { value: string; label: string };
  scope: {
    level: string;
    tenant: { value: string; label: string };
    project: { value: string; label: string };
  };
}

const initialValues: Values = {
  metadata: { name: '' },
  description: '',
  template: { value: '', label: '' },
  scope: {
    level: 'general',
    tenant: { value: '', label: '' },
    project: { value: '', label: '' },
  },
};

const renderFields = (role: 'providerAdmin' | 'tenantAdmin') =>
  renderWithProviders(
    <SessionProvider role={role} username="test-user">
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <CatalogItemGeneralFields
          templates={[{ value: 'tpl-1', label: 'Template One' }]}
          templatesLoading={false}
        />
      </Formik>
    </SessionProvider>,
  );

describe('CatalogItemGeneralFields', () => {
  it('renders Name, Description, and Template fields', () => {
    mockLists();
    renderFields('providerAdmin');

    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Template/)).toBeInTheDocument();
  });

  it('shows General/Organization scope options for a CSP Admin', () => {
    mockLists();
    renderFields('providerAdmin');

    expect(screen.getByRole('radio', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Organization' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Project' })).not.toBeInTheDocument();
  });

  it('reveals a tenant selector when a CSP Admin selects Organization scope', async () => {
    mockLists();
    const { user } = renderFields('providerAdmin');

    expect(screen.queryByLabelText('Select organization')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Organization' }));

    expect(screen.getByLabelText('Select organization')).toBeInTheDocument();
  });

  it('shows Organization/Project scope options for a Tenant Admin', () => {
    mockLists();
    renderFields('tenantAdmin');

    expect(screen.getByRole('radio', { name: 'Organization' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Project' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'General' })).not.toBeInTheDocument();
  });

  it('reveals a project selector when a Tenant Admin selects Project scope', async () => {
    mockLists();
    const { user } = renderFields('tenantAdmin');

    expect(screen.queryByLabelText('Select project')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Project' }));

    expect(screen.getByLabelText('Select project')).toBeInTheDocument();
  });
});
