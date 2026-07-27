import { createRouterTransport } from '@connectrpc/connect';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { BareMetalInstanceCatalogItem } from '@osac/types';
import {
  BareMetalInstanceCatalogItems,
  BareMetalInstanceRunStrategy,
  BareMetalInstances,
} from '@osac/types';
import { BareMetalInstanceCatalogItems as PrivateBareMetalInstanceCatalogItems } from '@osac/types/private';

import {
  type PatchBareMetalInstanceInput,
  useBareMetalInstanceCatalogItems,
  useCreateBareMetalInstanceCatalogItem,
  usePatchBareMetalInstance,
} from './baremetal-instance';
import { renderHookWithTransport as renderWithTransport } from '../../test-utils/renderHookWithTransport';
import { ApiProvider } from '../api-context';
import { createCatalogHookTests } from '../../test-utils/catalogHookTestHelpers';

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

const makeItem = (id: string) => ({ id, title: `item-${id}` });

describe('useCreateBareMetalInstanceCatalogItem', () => {
  it('calls the private client for providerAdmin', async () => {
    const createFn = vi.fn(() => ({ object: makeItem('a') }));
    const transport = createRouterTransport((router) => {
      router.service(PrivateBareMetalInstanceCatalogItems, { create: createFn });
    });

    const { result } = renderWithTransport(
      () => useCreateBareMetalInstanceCatalogItem(),
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
      router.service(BareMetalInstanceCatalogItems, { create: createFn });
    });

    const { result } = renderWithTransport(
      () => useCreateBareMetalInstanceCatalogItem(),
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
