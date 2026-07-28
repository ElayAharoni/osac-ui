import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Clusters } from '@osac/types';

import { useClustersForCatalogItem } from './cluster';
import { renderHookWithProviders } from '../../test-utils/TestProviders';

const makeCluster = (id: string) => ({
  id,
  metadata: { name: `cluster-${id}` },
  spec: { catalogItem: 'catalog-1' },
  status: {},
});

describe('useClustersForCatalogItem', () => {
  const createTestTransport = (onList: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(Clusters, {
        list: (req) => {
          onList(req);
          return { items: [makeCluster('cluster-1')], total: 1, size: 1 };
        },
      });
    });

  it('filters by catalog item id and forwards pagination params', async () => {
    let captured: Record<string, unknown> | undefined;
    const transport = createTestTransport((req) => {
      captured = req as Record<string, unknown>;
    });

    const { result } = renderHookWithProviders(
      () => useClustersForCatalogItem('catalog-1', { limit: 10, offset: 20 }),
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

    const { result } = renderHookWithProviders(() => useClustersForCatalogItem('catalog-1', {}), {
      role: 'providerAdmin',
      transport,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ items: [makeCluster('cluster-1')], total: 1 });
  });

  it('does not fetch when catalogItemId is empty', async () => {
    let listCalled = false;
    const transport = createTestTransport(() => {
      listCalled = true;
    });

    renderHookWithProviders(() => useClustersForCatalogItem('', {}), {
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

    renderHookWithProviders(() => useClustersForCatalogItem('   ', {}), {
      role: 'providerAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listCalled).toBe(false);
  });
});
