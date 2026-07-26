import { createRouterTransport } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ComputeInstanceCatalogItems } from '@osac/types';
import { ComputeInstanceCatalogItems as PrivateComputeInstanceCatalogItems } from '@osac/types/private';

import { ComputeInstanceCatalogItemCreatePage } from './ComputeInstanceCatalogItemCreatePage';
import * as instanceTypesApi from '../../../api/v1/instance-types';
import * as organizationApi from '../../../api/v1/organization';
import * as projectsApi from '../../../api/v1/projects';
import { SessionProvider } from '../../../hooks/use-session';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('../../../api/v1/instance-types', () => ({ useInstanceTypes: vi.fn() }));
vi.mock('../../../api/v1/organization', () => ({ useOrganizations: vi.fn() }));
vi.mock('../../../api/v1/projects', () => ({ useProjects: vi.fn() }));

const asQueryResult = <T,>(data: T) =>
  ({ data, isLoading: false, error: null }) as unknown as ReturnType<
    typeof organizationApi.useOrganizations
  >;

const mockSharedData = () => {
  vi.mocked(instanceTypesApi.useInstanceTypes).mockReturnValue(
    asQueryResult([]) as unknown as ReturnType<typeof instanceTypesApi.useInstanceTypes>,
  );
  vi.mocked(organizationApi.useOrganizations).mockReturnValue(asQueryResult([]));
  vi.mocked(projectsApi.useProjects).mockReturnValue(
    asQueryResult([]) as unknown as ReturnType<typeof projectsApi.useProjects>,
  );
};

const createFn = vi.fn(() => ({ object: { id: 'new-id', title: 'My VM' } }));

const renderPage = () => {
  const transport = createRouterTransport((router) => {
    router.service(ComputeInstanceCatalogItems, { create: createFn });
    router.service(PrivateComputeInstanceCatalogItems, { create: createFn });
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
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Configuration').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Access').length).toBeGreaterThan(0);
    expect(screen.queryByText('Networking')).not.toBeInTheDocument();
  });

  it('submits with published: false and auto-includes network_attachments', async () => {
    mockSharedData();
    createFn.mockClear();
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/^Name/), 'My VM');
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
});
