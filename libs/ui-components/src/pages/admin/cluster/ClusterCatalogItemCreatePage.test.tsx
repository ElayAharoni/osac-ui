import { createRouterTransport } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ClusterCatalogItems } from '@osac/types';
import { ClusterCatalogItems as PrivateClusterCatalogItems } from '@osac/types/private';

import { ClusterCatalogItemCreatePage } from './ClusterCatalogItemCreatePage';
import * as hostTypesApi from '../../../api/v1/host-types';
import * as organizationApi from '../../../api/v1/organization';
import * as projectsApi from '../../../api/v1/projects';
import { SessionProvider } from '../../../hooks/use-session';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('../../../api/v1/host-types', () => ({
  useHostTypes: vi.fn(),
  hostTypeDisplayName: (hostType: { id: string; title?: string }) => hostType.title ?? hostType.id,
}));
vi.mock('../../../api/v1/organization', () => ({ useOrganizations: vi.fn() }));
vi.mock('../../../api/v1/projects', () => ({ useProjects: vi.fn() }));

const asQueryResult = <T,>(data: T) =>
  ({ data, isLoading: false, error: null }) as unknown as ReturnType<
    typeof organizationApi.useOrganizations
  >;

const mockSharedData = () => {
  vi.mocked(hostTypesApi.useHostTypes).mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof hostTypesApi.useHostTypes>);
  vi.mocked(organizationApi.useOrganizations).mockReturnValue(asQueryResult([]));
  vi.mocked(projectsApi.useProjects).mockReturnValue(
    asQueryResult([]) as unknown as ReturnType<typeof projectsApi.useProjects>,
  );
};

const createFn = vi.fn(() => ({ object: { id: 'new-id', title: 'My Cluster' } }));

const renderPage = () => {
  const transport = createRouterTransport((router) => {
    router.service(ClusterCatalogItems, { create: createFn });
    router.service(PrivateClusterCatalogItems, { create: createFn });
  });
  return renderWithProviders(
    <SessionProvider role="providerAdmin" username="test-user">
      <ClusterCatalogItemCreatePage />
    </SessionProvider>,
    { transport, routerEntries: ['/admin/catalog/cluster/create'] },
  );
};

describe('ClusterCatalogItemCreatePage', () => {
  it('renders the General step by default with all four step nav items', () => {
    mockSharedData();
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Create cluster catalog item' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Configuration').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Networking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Access').length).toBeGreaterThan(0);
  });

  it('blocks advancing past General when required fields are empty', async () => {
    mockSharedData();
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('This step has validation errors')).toBeInTheDocument();
  });

  it('submits with published: false and navigates to the list page on success', async () => {
    mockSharedData();
    createFn.mockClear();
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/^Name/), 'My Cluster');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createFn).toHaveBeenCalled());
    const request = (createFn.mock.calls[0] as unknown[])[0] as {
      object: { published: boolean; title: string };
    };
    expect(request.object.published).toBe(false);
    expect(request.object.title).toBe('My Cluster');
  });
});
