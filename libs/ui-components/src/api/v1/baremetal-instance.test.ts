import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BareMetalInstanceCatalogItem } from '@osac/types';
import {
  BareMetalInstanceCatalogItems,
  BareMetalInstanceRunStrategy,
  BareMetalInstances,
} from '@osac/types';

import {
  type PatchBareMetalInstanceInput,
  useBareMetalInstanceCatalogItem,
  useBareMetalInstanceCatalogItems,
  useBareMetalInstancesForCatalogItem,
  usePatchBareMetalInstance,
} from './baremetal-instance';
import { createCatalogHookTests } from '../../test-utils/catalogHookTestHelpers';
import { renderHookWithProviders } from '../../test-utils/TestProviders';
import { ApiProvider } from '../api-context';

const item: BareMetalInstanceCatalogItem = {
  $typeName: 'osac.public.v1.BareMetalInstanceCatalogItem',
  id: 'public-1',
  title: 'Public bare metal item',
  description: '',
  template: '',
  published: true,
  fieldDefinitions: [],
};

describe('useBareMetalInstanceCatalogItems', () => {
  createCatalogHookTests({
    endpointDescription: 'public BareMetalInstanceCatalogItems',
    useHook: useBareMetalInstanceCatalogItems,
    role: 'tenantAdmin',
    item,
    registerList: (router, onList) =>
      router.service(BareMetalInstanceCatalogItems, {
        list: () => {
          onList?.();
          return { items: [item] };
        },
      }),
  });
});

describe('useBareMetalInstanceCatalogItem', () => {
  const createTestTransport = (onGet?: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(BareMetalInstanceCatalogItems, {
        get: (req) => {
          onGet?.(req);
          return { object: item };
        },
      });
    });

  it('fetches a single catalog item by id from the Get endpoint', async () => {
    const transport = createTestTransport();
    const { result } = renderHookWithProviders(() => useBareMetalInstanceCatalogItem('public-1'), {
      role: 'tenantAdmin',
      transport,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject(item);
  });

  it('does not fetch when id is undefined', async () => {
    let getCalled = false;
    const transport = createTestTransport(() => {
      getCalled = true;
    });

    renderHookWithProviders(() => useBareMetalInstanceCatalogItem(undefined), {
      role: 'tenantAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCalled).toBe(false);
  });
});

const makeBmi = (id: string) => ({
  id,
  metadata: { name: `bmi-${id}` },
  spec: {
    catalogItem: 'catalog-1',
    runStrategy: BareMetalInstanceRunStrategy.ALWAYS,
    restartTrigger: 0n,
  },
  status: {},
});

describe('usePatchBareMetalInstance', () => {
  const createTestTransport = (updateFn: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(BareMetalInstances, {
        list: () => ({ items: [makeBmi('bmi-1')] }),
        get: () => ({ object: makeBmi('bmi-1') }),
        update: (req) => {
          updateFn(req);
          return { object: makeBmi('bmi-1') };
        },
      });
    });

  const renderUsePatch = (transport: ReturnType<typeof createRouterTransport>) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ApiProvider,
        { transport } as React.ComponentProps<typeof ApiProvider>,
        createElement(QueryClientProvider, { client: queryClient }, children),
      );
    return { ...renderHook(() => usePatchBareMetalInstance(), { wrapper }), queryClient };
  };

  const mutateAndCapture = async (input: PatchBareMetalInstanceInput) => {
    let captured: Record<string, unknown> | undefined;
    const transport = createTestTransport((req) => {
      captured = req as Record<string, unknown>;
    });
    const { result } = renderUsePatch(transport);

    act(() => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(true);
    return captured;
  };

  it('sends updateMask with spec.run_strategy for stop action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'stop' });
    expect(req).toBeDefined();
    expect((req as { updateMask?: { paths: string[] } }).updateMask?.paths).toEqual([
      'spec.run_strategy',
    ]);
  });

  it('sends updateMask with spec.run_strategy for start action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'start' });
    expect(req).toBeDefined();
    expect((req as { updateMask?: { paths: string[] } }).updateMask?.paths).toEqual([
      'spec.run_strategy',
    ]);
  });

  it('sends updateMask with spec.restart_trigger for restart action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'restart', currentTrigger: 0n });
    expect(req).toBeDefined();
    expect((req as { updateMask?: { paths: string[] } }).updateMask?.paths).toEqual([
      'spec.restart_trigger',
    ]);
  });

  it('sets run_strategy to HALTED for stop action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'stop' });
    const object = (req as { object?: { spec?: { runStrategy?: number } } }).object;
    expect(object?.spec?.runStrategy).toBe(BareMetalInstanceRunStrategy.HALTED);
  });

  it('sets run_strategy to ALWAYS for start action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'start' });
    const object = (req as { object?: { spec?: { runStrategy?: number } } }).object;
    expect(object?.spec?.runStrategy).toBe(BareMetalInstanceRunStrategy.ALWAYS);
  });

  it('increments restart_trigger for restart action', async () => {
    const req = await mutateAndCapture({ id: 'bmi-1', action: 'restart', currentTrigger: 3n });
    const object = (req as { object?: { spec?: { restartTrigger?: bigint } } }).object;
    expect(object?.spec?.restartTrigger).toBe(4n);
  });
});

describe('useBareMetalInstancesForCatalogItem', () => {
  const createTestTransport = (onList: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(BareMetalInstances, {
        list: (req) => {
          onList(req);
          return { items: [makeBmi('bmi-1')], total: 1, size: 1 };
        },
      });
    });

  it('filters by catalog item id and forwards pagination params', async () => {
    let captured: Record<string, unknown> | undefined;
    const transport = createTestTransport((req) => {
      captured = req as Record<string, unknown>;
    });

    const { result } = renderHookWithProviders(
      () => useBareMetalInstancesForCatalogItem('catalog-1', { limit: 10, offset: 20 }),
      { role: 'providerAdmin', transport },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(captured).toMatchObject({
      filter: 'this.spec.catalog_item == "catalog-1"',
      limit: 10,
      offset: 20,
    });
  });

  it('returns items and total from the list response', async () => {
    const transport = createTestTransport(() => {});

    const { result } = renderHookWithProviders(
      () => useBareMetalInstancesForCatalogItem('catalog-1', {}),
      { role: 'providerAdmin', transport },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ items: [makeBmi('bmi-1')], total: 1 });
  });

  it('does not fetch when catalogItemId is empty', async () => {
    let listCalled = false;
    const transport = createTestTransport(() => {
      listCalled = true;
    });

    renderHookWithProviders(() => useBareMetalInstancesForCatalogItem('', {}), {
      role: 'providerAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listCalled).toBe(false);
  });

  it('does not fetch when catalogItemId is whitespace-only', async () => {
    let listCalled = false;
    const transport = createTestTransport(() => {
      listCalled = true;
    });

    renderHookWithProviders(() => useBareMetalInstancesForCatalogItem('   ', {}), {
      role: 'providerAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listCalled).toBe(false);
  });
});
