import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import { CatalogItemGeneralFields } from './CatalogItemGeneralFields';
import * as tenantApi from '../../api/v1/private/tenant';
import * as projectsApi from '../../api/v1/projects';
import { SessionProvider } from '../../hooks/use-session';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('../../api/v1/private/tenant', () => ({ usePrivateTenants: vi.fn() }));
vi.mock('../../api/v1/projects', () => ({ useProjects: vi.fn() }));

const asQueryResult = <T,>(data: T) =>
  ({ data, isLoading: false, error: null }) as unknown as ReturnType<
    typeof tenantApi.usePrivateTenants
  >;

const mockLists = () => {
  vi.mocked(tenantApi.usePrivateTenants).mockReturnValue(
    asQueryResult([{ id: 'acme', metadata: { name: 'Acme' } }]),
  );
  vi.mocked(projectsApi.useProjects).mockReturnValue(
    asQueryResult([{ id: 'proj-1', metadata: { name: 'Project One' } }]) as unknown as ReturnType<
      typeof projectsApi.useProjects
    >,
  );
};

interface Values {
  title: string;
  resourceName: string;
  description: string;
  template: { value: string; label: string };
  scope: {
    level: string;
    tenant: { value: string; label: string };
    project: { value: string; label: string };
  };
}

const initialValues: Values = {
  title: '',
  resourceName: '',
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
  it('renders Title, Name, Description, and Template fields', () => {
    mockLists();
    renderFields('providerAdmin');

    expect(screen.getByLabelText(/^Title/)).toBeInTheDocument();
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

    expect(screen.queryByLabelText(/^Select organization/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Organization' }));

    expect(screen.getByLabelText(/^Select organization/)).toBeInTheDocument();
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

    expect(screen.queryByLabelText(/^Select project/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Project' }));

    expect(screen.getByLabelText(/^Select project/)).toBeInTheDocument();
  });

  it('shows the project display name, not its id, in the project selector options', async () => {
    mockLists();
    const { user } = renderFields('tenantAdmin');

    await user.click(screen.getByRole('radio', { name: 'Project' }));
    await user.click(screen.getByLabelText(/^Select project/));

    expect(screen.getByRole('option', { name: 'Project One' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'proj-1' })).not.toBeInTheDocument();
  });

  it('does not call the private Tenants API for a Tenant Admin', () => {
    mockLists();
    renderFields('tenantAdmin');

    expect(tenantApi.usePrivateTenants).toHaveBeenCalledWith(false);
  });

  it('calls the private Tenants API for a CSP Admin', () => {
    mockLists();
    renderFields('providerAdmin');

    expect(tenantApi.usePrivateTenants).toHaveBeenCalledWith(true);
  });
});
