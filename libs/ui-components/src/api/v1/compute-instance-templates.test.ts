import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ComputeInstanceTemplates } from '@osac/types';
import { ComputeInstanceTemplates as PrivateComputeInstanceTemplates } from '@osac/types/private';

import {
  useAdminComputeInstanceTemplates,
  useComputeInstanceTemplates,
} from './compute-instance-templates';
import { renderHookWithTransport as renderWithTransport } from '../../test-utils/renderHookWithTransport';

const makeTemplate = (id: string) => ({ id, metadata: { name: `template-${id}` } });

describe('useComputeInstanceTemplates', () => {
  it('lists public compute instance templates', async () => {
    const transport = createRouterTransport((router) => {
      router.service(ComputeInstanceTemplates, { list: () => ({ items: [makeTemplate('a')] }) });
    });

    const { result } = renderWithTransport(() => useComputeInstanceTemplates(), transport);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject([makeTemplate('a')]);
  });
});

describe('useAdminComputeInstanceTemplates', () => {
  it('calls the private client for providerAdmin', async () => {
    const transport = createRouterTransport((router) => {
      router.service(ComputeInstanceTemplates, { list: () => ({ items: [] }) });
      router.service(PrivateComputeInstanceTemplates, {
        list: () => ({ items: [makeTemplate('admin')] }),
      });
    });

    const { result } = renderWithTransport(
      () => useAdminComputeInstanceTemplates(),
      transport,
      'providerAdmin',
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject([makeTemplate('admin')]);
  });

  it('calls the public client for tenantAdmin', async () => {
    const transport = createRouterTransport((router) => {
      router.service(ComputeInstanceTemplates, {
        list: () => ({ items: [makeTemplate('tenant')] }),
      });
      router.service(PrivateComputeInstanceTemplates, { list: () => ({ items: [] }) });
    });

    const { result } = renderWithTransport(
      () => useAdminComputeInstanceTemplates(),
      transport,
      'tenantAdmin',
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject([makeTemplate('tenant')]);
  });
});
