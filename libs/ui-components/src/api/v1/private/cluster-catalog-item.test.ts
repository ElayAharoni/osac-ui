import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types/private';
import { ClusterCatalogItems } from '@osac/types/private';

import {
  usePrivateClusterCatalogItem,
  usePrivateClusterCatalogItems,
} from './cluster-catalog-item';
import { createCatalogHookTests } from '../../../test-utils/catalogHookTestHelpers';
import { renderHookWithProviders } from '../../../test-utils/TestProviders';

const item: ClusterCatalogItem = {
  $typeName: 'osac.private.v1.ClusterCatalogItem',
  id: 'private-1',
  title: 'Private cluster item',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

describe('usePrivateClusterCatalogItems', () => {
  createCatalogHookTests({
    endpointDescription: 'private ClusterCatalogItems',
    useHook: usePrivateClusterCatalogItems,
    role: 'providerAdmin',
    item,
    registerList: (router, onList) =>
      router.service(ClusterCatalogItems, {
        list: () => {
          onList?.();
          return { items: [item] };
        },
      }),
  });
});

describe('usePrivateClusterCatalogItem', () => {
  const createTestTransport = (onGet?: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(ClusterCatalogItems, {
        get: (req) => {
          onGet?.(req);
          return { object: item };
        },
      });
    });

  it('fetches a single catalog item by id from the Get endpoint', async () => {
    const transport = createTestTransport();
    const { result } = renderHookWithProviders(() => usePrivateClusterCatalogItem('private-1'), {
      role: 'providerAdmin',
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

    renderHookWithProviders(() => usePrivateClusterCatalogItem(undefined), {
      role: 'providerAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCalled).toBe(false);
  });
});
