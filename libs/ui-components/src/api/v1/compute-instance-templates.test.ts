import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ComputeInstanceTemplates } from '@osac/types';
import { ComputeInstanceTemplates as PrivateComputeInstanceTemplates } from '@osac/types/private';

import {
  useAdminComputeInstanceTemplates,
  useComputeInstanceTemplates,
} from './compute-instance-templates';
import { SessionProvider } from '../../hooks/use-session';
import { ApiProvider } from '../api-context';

const makeTemplate = (id: string) => ({ id, metadata: { name: `template-${id}` } });

const renderWithTransport = <T>(
  hook: () => T,
  transport: ReturnType<typeof createRouterTransport>,
  role?: 'providerAdmin' | 'tenantAdmin',
) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => {
    const body = createElement(QueryClientProvider, { client: queryClient }, children);
    const withApi = createElement(
      ApiProvider,
      { transport } as React.ComponentProps<typeof ApiProvider>,
      body,
    );
    return role
      ? createElement(
          SessionProvider,
          { role, username: 'test-user' } as React.ComponentProps<typeof SessionProvider>,
          withApi,
        )
      : withApi;
  };
  return renderHook(hook, { wrapper });
};

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
