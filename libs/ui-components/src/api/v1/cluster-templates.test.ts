import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ClusterTemplates } from '@osac/types';
import { ClusterTemplates as PrivateClusterTemplates } from '@osac/types/private';

import { useAdminClusterTemplates, useClusterTemplates } from './cluster-templates';
import { renderHookWithTransport as renderWithTransport } from '../../test-utils/renderHookWithTransport';

const makeTemplate = (id: string) => ({ id, metadata: { name: `template-${id}` } });

describe('useClusterTemplates', () => {
  it('lists public cluster templates', async () => {
    const transport = createRouterTransport((router) => {
      router.service(ClusterTemplates, { list: () => ({ items: [makeTemplate('a')] }) });
    });

    const { result } = renderWithTransport(() => useClusterTemplates(), transport);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject([makeTemplate('a')]);
  });
});

describe('useAdminClusterTemplates', () => {
  it('calls the private client for providerAdmin', async () => {
    const transport = createRouterTransport((router) => {
      router.service(ClusterTemplates, { list: () => ({ items: [] }) });
      router.service(PrivateClusterTemplates, { list: () => ({ items: [makeTemplate('admin')] }) });
    });

    const { result } = renderWithTransport(
      () => useAdminClusterTemplates(),
      transport,
      'providerAdmin',
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject([makeTemplate('admin')]);
  });

  it('calls the public client for tenantAdmin', async () => {
    const transport = createRouterTransport((router) => {
      router.service(ClusterTemplates, { list: () => ({ items: [makeTemplate('tenant')] }) });
      router.service(PrivateClusterTemplates, { list: () => ({ items: [] }) });
    });

    const { result } = renderWithTransport(
      () => useAdminClusterTemplates(),
      transport,
      'tenantAdmin',
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject([makeTemplate('tenant')]);
  });
});
