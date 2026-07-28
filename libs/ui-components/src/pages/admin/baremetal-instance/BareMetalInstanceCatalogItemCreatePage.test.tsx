import { createRouterTransport } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BareMetalInstanceCatalogItems, BareMetalInstanceTemplates } from '@osac/types';
import {
  BareMetalInstanceCatalogItems as PrivateBareMetalInstanceCatalogItems,
  BareMetalInstanceTemplates as PrivateBareMetalInstanceTemplates,
} from '@osac/types/private';

import { BareMetalInstanceCatalogItemCreatePage } from './BareMetalInstanceCatalogItemCreatePage';
import * as projectsApi from '../../../api/v1/projects';
import * as tenantApi from '../../../api/v1/tenant';
import { SessionProvider } from '../../../hooks/use-session';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('../../../api/v1/tenant', () => ({ useTenants: vi.fn() }));
vi.mock('../../../api/v1/projects', () => ({ useProjects: vi.fn() }));

const asQueryResult = <T,>(data: T) =>
  ({ data, isLoading: false, error: null }) as unknown as ReturnType<typeof tenantApi.useTenants>;

const mockSharedData = () => {
  vi.mocked(tenantApi.useTenants).mockReturnValue(asQueryResult([]));
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
  await user.type(screen.getByLabelText(/^Display name/), title);
  await user.type(screen.getByLabelText(/^Resource name/), resourceName);
};

const createFn = vi.fn(() => ({ object: { id: 'new-id', title: 'My Bare Metal' } }));

const renderPage = () => {
  const transport = createRouterTransport((router) => {
    router.service(BareMetalInstanceCatalogItems, { create: createFn });
    router.service(PrivateBareMetalInstanceCatalogItems, { create: createFn });
    router.service(BareMetalInstanceTemplates, { list: () => ({ items: [] }) });
    router.service(PrivateBareMetalInstanceTemplates, {
      list: () => ({ items: [{ id: 'tmpl-1', metadata: { name: 'Template One' } }] }),
    });
  });
  return renderWithProviders(
    <SessionProvider role="providerAdmin" username="test-user">
      <BareMetalInstanceCatalogItemCreatePage />
    </SessionProvider>,
    { transport, routerEntries: ['/admin/catalog/baremetal-instance/create'] },
  );
};

describe('BareMetalInstanceCatalogItemCreatePage', () => {
  it('renders the General step by default with all three step nav items and no Networking step', () => {
    mockSharedData();
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Create bare metal catalog item' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Display name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Resource name/)).toBeInTheDocument();
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Configuration').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Access').length).toBeGreaterThan(0);
    expect(screen.queryByText('Networking')).not.toBeInTheDocument();
  });

  it('blocks advancing past General when no template is selected', async () => {
    mockSharedData();
    const { user } = renderPage();

    await fillNames(user, 'My Bare Metal', 'my-bare-metal');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('This step has validation errors')).toBeInTheDocument();
  });

  it('blocks advancing past General when Organization scope is selected without an organization', async () => {
    mockSharedData();
    const { user } = renderPage();

    await fillNames(user, 'My Bare Metal', 'my-bare-metal');
    await selectTemplate(user);
    await user.click(screen.getByRole('radio', { name: 'Organization' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('This step has validation errors')).toBeInTheDocument();
  });

  it('submits with published: false', async () => {
    mockSharedData();
    createFn.mockClear();
    const { user } = renderPage();

    await fillNames(user, 'My Bare Metal', 'my-bare-metal');
    await selectTemplate(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createFn).toHaveBeenCalled());
    const request = (createFn.mock.calls[0] as unknown[])[0] as {
      object: { published: boolean; title: string };
    };
    expect(request.object.published).toBe(false);
    expect(request.object.title).toBe('My Bare Metal');
  });
});
