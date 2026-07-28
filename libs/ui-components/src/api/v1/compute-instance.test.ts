import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ComputeInstanceState, ComputeInstances } from '@osac/types';

import { useComputeInstancesForCatalogItem, usePatchComputeInstance } from './compute-instance';
import { renderHookWithProviders } from '../../test-utils/TestProviders';
import { ApiProvider } from '../api-context';

const makeVm = (id: string, state: ComputeInstanceState) => ({
  id,
  status: { state },
  metadata: { name: `vm-${id}` },
  spec: {},
});

describe('usePatchComputeInstance', () => {
  const createTestTransport = (updateFn: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(ComputeInstances, {
        list: () => ({
          items: [makeVm('vm-1', ComputeInstanceState.RUNNING)],
        }),
        get: () => ({
          object: makeVm('vm-1', ComputeInstanceState.RUNNING),
        }),
        update: (req) => {
          updateFn(req);
          return { object: makeVm('vm-1', ComputeInstanceState.STOPPING) };
        },
      });
    });

  const renderUsePatchComputeInstance = (transport: ReturnType<typeof createRouterTransport>) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ApiProvider,
        { transport } as React.ComponentProps<typeof ApiProvider>,
        createElement(QueryClientProvider, { client: queryClient }, children),
      );
    return { ...renderHook(() => usePatchComputeInstance(), { wrapper }), queryClient };
  };

  const mutateAndCapture = async (powerAction: 'start' | 'stop' | 'restart') => {
    let captured: Record<string, unknown> | undefined;
    const transport = createTestTransport((req) => {
      captured = req as Record<string, unknown>;
    });
    const { result } = renderUsePatchComputeInstance(transport);

    act(() => {
      result.current.mutate({ id: 'vm-1', powerAction });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(true);
    return captured;
  };

  it('sends updateMask with spec and status paths for stop action', async () => {
    const req = await mutateAndCapture('stop');
    expect(req).toBeDefined();
    const paths = (req as { updateMask?: { paths: string[] } }).updateMask?.paths;
    expect(paths).toContain('spec.run_strategy');
    expect(paths).toContain('status.state');
  });

  it('sends updateMask with spec and status paths for start action', async () => {
    const req = await mutateAndCapture('start');
    expect(req).toBeDefined();
    const paths = (req as { updateMask?: { paths: string[] } }).updateMask?.paths;
    expect(paths).toContain('spec.run_strategy');
    expect(paths).toContain('status.state');
  });

  it('sends updateMask with spec.restart_requested_at for restart action', async () => {
    const req = await mutateAndCapture('restart');
    expect(req).toBeDefined();
    const paths = (req as { updateMask?: { paths: string[] } }).updateMask?.paths;
    expect(paths).toContain('spec.restart_requested_at');
  });

  it('resolves successfully after a stop action', async () => {
    const req = await mutateAndCapture('stop');
    expect(req).toBeDefined();
  });
});

describe('useComputeInstancesForCatalogItem', () => {
  const createTestTransport = (onList: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(ComputeInstances, {
        list: (req) => {
          onList(req);
          return {
            items: [makeVm('vm-1', ComputeInstanceState.RUNNING)],
            total: 1,
            size: 1,
          };
        },
      });
    });

  it('filters by catalog item id and forwards pagination params', async () => {
    let captured: Record<string, unknown> | undefined;
    const transport = createTestTransport((req) => {
      captured = req as Record<string, unknown>;
    });

    const { result } = renderHookWithProviders(
      () => useComputeInstancesForCatalogItem('catalog-1', { limit: 10, offset: 20 }),
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
      () => useComputeInstancesForCatalogItem('catalog-1', {}),
      { role: 'providerAdmin', transport },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({
      items: [makeVm('vm-1', ComputeInstanceState.RUNNING)],
      total: 1,
    });
  });

  it('does not fetch when catalogItemId is empty', async () => {
    let listCalled = false;
    const transport = createTestTransport(() => {
      listCalled = true;
    });

    renderHookWithProviders(() => useComputeInstancesForCatalogItem('', {}), {
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

    renderHookWithProviders(() => useComputeInstancesForCatalogItem('   ', {}), {
      role: 'providerAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listCalled).toBe(false);
  });
});
