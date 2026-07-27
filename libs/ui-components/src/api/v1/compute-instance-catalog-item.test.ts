import { createRouterTransport } from '@connectrpc/connect';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';
import { ComputeInstanceCatalogItems } from '@osac/types';
import { ComputeInstanceCatalogItems as PrivateComputeInstanceCatalogItems } from '@osac/types/private';

import {
  useComputeInstanceCatalogItems,
  useCreateComputeInstanceCatalogItem,
} from './compute-instance-catalog-item';
import { createCatalogHookTests } from '../../test-utils/catalogHookTestHelpers';
import { renderHookWithTransport as renderWithTransport } from '../../test-utils/renderHookWithTransport';

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
