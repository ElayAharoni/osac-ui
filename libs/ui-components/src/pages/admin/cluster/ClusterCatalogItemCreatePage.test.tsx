import { createRouterTransport } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ClusterCatalogItems, ClusterTemplates } from '@osac/types';
import {
  ClusterCatalogItems as PrivateClusterCatalogItems,
  ClusterTemplates as PrivateClusterTemplates,
} from '@osac/types/private';

import { ClusterCatalogItemCreatePage } from './ClusterCatalogItemCreatePage';
import * as hostTypesApi from '../../../api/v1/host-types';
import * as tenantApi from '../../../api/v1/private/tenant';
import * as projectsApi from '../../../api/v1/projects';
import { SessionProvider } from '../../../hooks/use-session';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('../../../api/v1/host-types', () => ({
  useHostTypes: vi.fn(),
  hostTypeDisplayName: (hostType: { id: string; title?: string }) => hostType.title ?? hostType.id,
}));
vi.mock('../../../api/v1/private/tenant', () => ({ usePrivateTenants: vi.fn() }));
vi.mock('../../../api/v1/projects', () => ({ useProjects: vi.fn() }));

const asQueryResult = <T,>(data: T) =>
  ({ data, isLoading: false, error: null }) as unknown as ReturnType<
    typeof tenantApi.usePrivateTenants
  >;

const mockSharedData = () => {
  vi.mocked(hostTypesApi.useHostTypes).mockReturnValue({
    data: [{ id: 'small', title: 'Small' }],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof hostTypesApi.useHostTypes>);
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

const fillFirstNodeSet = async (user: ReturnType<typeof renderPage>['user']) => {
  await user.type(screen.getByLabelText('Default nodes'), '3');
};

const createFn = vi.fn(() => ({ object: { id: 'new-id', title: 'My Cluster' } }));

const renderPage = () => {
  const transport = createRouterTransport((router) => {
    router.service(ClusterCatalogItems, { create: createFn });
    router.service(PrivateClusterCatalogItems, { create: createFn });
    router.service(ClusterTemplates, { list: () => ({ items: [] }) });
    router.service(PrivateClusterTemplates, {
      list: () => ({
        items: [
          {
            id: 'tmpl-1',
            metadata: { name: 'Template One' },
            nodeSets: { workers: { hostType: 'small', size: 3 } },
          },
        ],
      }),
    });
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
    expect(screen.getByLabelText(/^Title/)).toBeInTheDocument();
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

  it('allows advancing past General with no Title, since only Name is required', async () => {
    mockSharedData();
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/^Name/), 'my-cluster');
    await selectTemplate(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.queryByText('This step has validation errors')).not.toBeInTheDocument();
  });

  it('blocks advancing past General when no template is selected', async () => {
    mockSharedData();
    const { user } = renderPage();

    await fillNames(user, 'My Cluster', 'my-cluster');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('This step has validation errors')).toBeInTheDocument();
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
  });

  it('blocks advancing past General when Organization scope is selected without an organization', async () => {
    mockSharedData();
    const { user } = renderPage();

    await fillNames(user, 'My Cluster', 'my-cluster');
    await selectTemplate(user);
    await user.click(screen.getByRole('radio', { name: 'Organization' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('This step has validation errors')).toBeInTheDocument();
  });

  it('scopes node sets to the selected template and blocks advancing until sizes are set', async () => {
    mockSharedData();
    const { user } = renderPage();

    await fillNames(user, 'My Cluster', 'my-cluster');
    await selectTemplate(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Workers')).toBeInTheDocument();
    expect(screen.getByText('Host type: Small')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Host type/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('This step has validation errors')).toBeInTheDocument();
    expect(screen.getAllByText('Configuration').length).toBeGreaterThan(0);
  });

  it('submits with published: false and navigates to the list page on success', async () => {
    mockSharedData();
    createFn.mockClear();
    const { user } = renderPage();

    await fillNames(user, 'My Cluster', 'my-cluster');
    await selectTemplate(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await fillFirstNodeSet(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createFn).toHaveBeenCalled());
    const request = (createFn.mock.calls[0] as unknown[])[0] as {
      object: {
        published: boolean;
        title: string;
        fieldDefinitions: { path: string; default: unknown }[];
      };
    };
    expect(request.object.published).toBe(false);
    expect(request.object.title).toBe('My Cluster');
    const nodeSets = request.object.fieldDefinitions.find((fd) => fd.path === 'node_sets');
    expect(nodeSets?.default).toMatchObject({
      kind: {
        case: 'structValue',
        value: {
          fields: {
            workers: {
              kind: {
                case: 'structValue',
                value: {
                  fields: {
                    hostType: { kind: { case: 'stringValue', value: 'small' } },
                    size: { kind: { case: 'numberValue', value: 3 } },
                  },
                },
              },
            },
          },
        },
      },
    });
  });
});
