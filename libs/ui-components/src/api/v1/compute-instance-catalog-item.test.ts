import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';
import { ComputeInstanceCatalogItems } from '@osac/types';
import { ComputeInstanceCatalogItems as PrivateComputeInstanceCatalogItems } from '@osac/types/private';

import {
  useComputeInstanceCatalogItems,
  useCreateComputeInstanceCatalogItem,
} from './compute-instance-catalog-item';
import { SessionProvider } from '../../hooks/use-session';
import { ApiProvider } from '../api-context';
import { createCatalogHookTests } from '../../test-utils/catalogHookTestHelpers';

const item: ComputeInstanceCatalogItem = {
  $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
  id: 'public-1',
  title: 'Public VM item',
  description: '',
  template: '',
  published: true,
  fieldDefinitions: [],
};

describe('useComputeInstanceCatalogItems', () => {
  createCatalogHookTests({
    endpointDescription: 'public ComputeInstanceCatalogItems',
    useHook: useComputeInstanceCatalogItems,
    role: 'tenantAdmin',
    item,
    registerList: (router, onList) =>
      router.service(ComputeInstanceCatalogItems, {
        list: () => {
          onList?.();
          return { items: [item] };
        },
      }),
  });
});

const makeItem = (id: string) => ({ id, title: `item-${id}` });

const renderWithTransport = <T>(
  hook: () => T,
  transport: ReturnType<typeof createRouterTransport>,
  role: 'providerAdmin' | 'tenantAdmin',
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => {
    const body = createElement(QueryClientProvider, { client: queryClient }, children);
    const withApi = createElement(
      ApiProvider,
      { transport } as React.ComponentProps<typeof ApiProvider>,
      body,
    );
    return createElement(
      SessionProvider,
      { role, username: 'test-user' } as React.ComponentProps<typeof SessionProvider>,
      withApi,
    );
  };
  return renderHook(hook, { wrapper });
};

describe('useCreateComputeInstanceCatalogItem', () => {
  it('calls the private client for providerAdmin', async () => {
    const createFn = vi.fn(() => ({ object: makeItem('a') }));
    const transport = createRouterTransport((router) => {
      router.service(PrivateComputeInstanceCatalogItems, { create: createFn });
    });

    const { result } = renderWithTransport(
      () => useCreateComputeInstanceCatalogItem(),
      transport,
      'providerAdmin',
    );

    act(() => {
      result.current.mutate({ title: 'item-a', published: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createFn).toHaveBeenCalled();
  });

  it('calls the public client for tenantAdmin', async () => {
    const createFn = vi.fn(() => ({ object: makeItem('b') }));
    const transport = createRouterTransport((router) => {
      router.service(ComputeInstanceCatalogItems, { create: createFn });
    });

    const { result } = renderWithTransport(
      () => useCreateComputeInstanceCatalogItem(),
      transport,
      'tenantAdmin',
    );

    act(() => {
      result.current.mutate({ title: 'item-b', published: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createFn).toHaveBeenCalled();
  });
});
