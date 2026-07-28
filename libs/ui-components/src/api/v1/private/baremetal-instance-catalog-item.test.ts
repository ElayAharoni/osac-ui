import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BareMetalInstanceCatalogItem } from '@osac/types/private';
import { BareMetalInstanceCatalogItems } from '@osac/types/private';

import {
  usePrivateBareMetalInstanceCatalogItem,
  usePrivateBareMetalInstanceCatalogItems,
} from './baremetal-instance-catalog-item';
import { createCatalogHookTests } from '../../../test-utils/catalogHookTestHelpers';
import { renderHookWithProviders } from '../../../test-utils/TestProviders';

const item: BareMetalInstanceCatalogItem = {
  $typeName: 'osac.private.v1.BareMetalInstanceCatalogItem',
  id: 'private-1',
  title: 'Private bare metal item',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

describe('usePrivateBareMetalInstanceCatalogItems', () => {
  createCatalogHookTests({
    endpointDescription: 'private BareMetalInstanceCatalogItems',
    useHook: usePrivateBareMetalInstanceCatalogItems,
    role: 'providerAdmin',
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

describe('usePrivateBareMetalInstanceCatalogItem', () => {
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
    const { result } = renderHookWithProviders(
      () => usePrivateBareMetalInstanceCatalogItem('private-1'),
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

    renderHookWithProviders(() => usePrivateBareMetalInstanceCatalogItem(undefined), {
      role: 'providerAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCalled).toBe(false);
  });
});
