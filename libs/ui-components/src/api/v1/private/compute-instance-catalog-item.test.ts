import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types/private';
import { ComputeInstanceCatalogItems } from '@osac/types/private';

import {
  usePrivateComputeInstanceCatalogItem,
  usePrivateComputeInstanceCatalogItems,
} from './compute-instance-catalog-item';
import { createCatalogHookTests } from '../../../test-utils/catalogHookTestHelpers';
import { renderHookWithProviders } from '../../../test-utils/TestProviders';

const item: ComputeInstanceCatalogItem = {
  $typeName: 'osac.private.v1.ComputeInstanceCatalogItem',
  id: 'private-1',
  title: 'Private VM item',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

describe('usePrivateComputeInstanceCatalogItems', () => {
  createCatalogHookTests({
    endpointDescription: 'private ComputeInstanceCatalogItems',
    useHook: usePrivateComputeInstanceCatalogItems,
    role: 'providerAdmin',
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

describe('usePrivateComputeInstanceCatalogItem', () => {
  const createTestTransport = (onGet?: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(ComputeInstanceCatalogItems, {
        get: (req) => {
          onGet?.(req);
          return { object: item };
        },
      });
    });

  it('fetches a single catalog item by id from the Get endpoint', async () => {
    const transport = createTestTransport();
    const { result } = renderHookWithProviders(
      () => usePrivateComputeInstanceCatalogItem('private-1'),
      { role: 'providerAdmin', transport },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject(item);
  });

  it('does not fetch when id is undefined', async () => {
    let getCalled = false;
    const transport = createTestTransport(() => {
      getCalled = true;
    });

    renderHookWithProviders(() => usePrivateComputeInstanceCatalogItem(undefined), {
      role: 'providerAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCalled).toBe(false);
  });
});
