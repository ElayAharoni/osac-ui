import { createRouterTransport } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ComputeInstanceCatalogItems, ComputeInstanceTemplates } from '@osac/types';
import {
  ComputeInstanceCatalogItems as PrivateComputeInstanceCatalogItems,
  ComputeInstanceTemplates as PrivateComputeInstanceTemplates,
} from '@osac/types/private';

import { ComputeInstanceCatalogItemCreatePage } from './ComputeInstanceCatalogItemCreatePage';
import * as instanceTypesApi from '../../../api/v1/instance-types';
import * as tenantApi from '../../../api/v1/private/tenant';
import * as projectsApi from '../../../api/v1/projects';
import { SessionProvider } from '../../../hooks/use-session';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('../../../api/v1/instance-types', () => ({ useInstanceTypes: vi.fn() }));
vi.mock('../../../api/v1/private/tenant', () => ({ usePrivateTenants: vi.fn() }));
vi.mock('../../../api/v1/projects', () => ({ useProjects: vi.fn() }));

const asQueryResult = <T,>(data: T) =>
  ({ data, isLoading: false, error: null }) as unknown as ReturnType<
    typeof tenantApi.usePrivateTenants
  >;

const mockSharedData = (
  instanceTypes: {
    id: string;
    metadata?: { name?: string };
    spec?: Record<string, unknown>;
  }[] = [],
) => {
  vi.mocked(instanceTypesApi.useInstanceTypes).mockReturnValue(
    asQueryResult(instanceTypes) as unknown as ReturnType<typeof instanceTypesApi.useInstanceTypes>,
  );
  vi.mocked(tenantApi.usePrivateTenants).mockReturnValue(asQueryResult([]));
  vi.mocked(projectsApi.useProjects).mockReturnValue(
    asQueryResult([]) as unknown as ReturnType<typeof projectsApi.useProjects>,
  );
};

const selectTemplate = async (user: ReturnType<typeof renderPage>['user']) => {
  await user.click(screen.getByLabelText(/^Template/));
  await user.click(screen.getByRole('option', { name: 'Template One' }));
};

const fillNames = async (
  user: ReturnType<typeof renderPage>['user'],
  title: string,
  resourceName: string,
) => {
  await user.type(screen.getByLabelText(/^Title/), title);
  await user.type(screen.getByLabelText(/^Name/), resourceName);
};

const createFn = vi.fn(() => ({ object: { id: 'new-id', title: 'My VM' } }));

const renderPage = () => {
  const transport = createRouterTransport((router) => {
    router.service(ComputeInstanceCatalogItems, { create: createFn });
    router.service(PrivateComputeInstanceCatalogItems, { create: createFn });
    router.service(ComputeInstanceTemplates, { list: () => ({ items: [] }) });
    router.service(PrivateComputeInstanceTemplates, {
      list: () => ({ items: [{ id: 'tmpl-1', metadata: { name: 'Template One' } }] }),
    });
  });
  return renderWithProviders(
    <SessionProvider role="providerAdmin" username="test-user">
      <ComputeInstanceCatalogItemCreatePage />
    </SessionProvider>,
    { transport, routerEntries: ['/admin/catalog/compute-instance/create'] },
  );
};

describe('ComputeInstanceCatalogItemCreatePage', () => {
  it('renders the General step by default with all three step nav items', () => {
    mockSharedData();
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Create virtual machine catalog item' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Configuration').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Access').length).toBeGreaterThan(0);
    expect(screen.queryByText('Networking')).not.toBeInTheDocument();
  });

  it('blocks advancing past General when no template is selected', async () => {
    mockSharedData();
    const { user } = renderPage();

    await fillNames(user, 'My VM', 'my-vm');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('This step has validation errors')).toBeInTheDocument();
  });

  it('blocks advancing past General when Organization scope is selected without an organization', async () => {
    mockSharedData();
    const { user } = renderPage();

    await fillNames(user, 'My VM', 'my-vm');
    await selectTemplate(user);
    await user.click(screen.getByRole('radio', { name: 'Organization' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('This step has validation errors')).toBeInTheDocument();
  });

  it('submits with published: false and auto-includes network_attachments', async () => {
    mockSharedData();
    createFn.mockClear();
    const { user } = renderPage();

    await fillNames(user, 'My VM', 'my-vm');
    await selectTemplate(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createFn).toHaveBeenCalled());
    const request = (createFn.mock.calls[0] as unknown[])[0] as {
      object: {
        published: boolean;
        title: string;
        fieldDefinitions: { path: string }[];
      };
    };
    expect(request.object.published).toBe(false);
    expect(request.object.title).toBe('My VM');
    expect(request.object.fieldDefinitions.map((fd) => fd.path)).toContain('network_attachments');
  });

  it('flattens the selected instance type to its id, not the whole {value, label} ref, when serializing the default', async () => {
    mockSharedData([
      { id: 'small', metadata: { name: 'Small' }, spec: { cores: 2, memoryGib: 4 } },
    ]);
    createFn.mockClear();
    const { user } = renderPage();

    await fillNames(user, 'My VM', 'my-vm');
    await selectTemplate(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Default value' }));
    await user.click(screen.getByRole('option', { name: /Small/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createFn).toHaveBeenCalled());
    const request = (createFn.mock.calls[0] as unknown[])[0] as {
      object: { fieldDefinitions: { path: string; default: unknown }[] };
    };
    const instanceType = request.object.fieldDefinitions.find((fd) => fd.path === 'instance_type');
    expect(instanceType?.default).toMatchObject({ kind: { case: 'stringValue', value: 'small' } });
  });
});
