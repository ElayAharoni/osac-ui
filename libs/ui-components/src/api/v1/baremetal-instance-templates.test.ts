import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BareMetalInstanceTemplates } from '@osac/types';
import { BareMetalInstanceTemplates as PrivateBareMetalInstanceTemplates } from '@osac/types/private';

import {
  useAdminBareMetalInstanceTemplates,
  useBareMetalInstanceTemplates,
} from './baremetal-instance-templates';
import { renderHookWithTransport as renderWithTransport } from '../../test-utils/renderHookWithTransport';

const makeTemplate = (id: string) => ({ id, metadata: { name: `template-${id}` } });

describe('useBareMetalInstanceTemplates', () => {
  it('lists public bare metal instance templates', async () => {
    const transport = createRouterTransport((router) => {
      router.service(BareMetalInstanceTemplates, { list: () => ({ items: [makeTemplate('a')] }) });
    });

    const { result } = renderWithTransport(() => useBareMetalInstanceTemplates(), transport);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject([makeTemplate('a')]);
  });
});

describe('useAdminBareMetalInstanceTemplates', () => {
  it('calls the private client for providerAdmin', async () => {
    const transport = createRouterTransport((router) => {
      router.service(BareMetalInstanceTemplates, { list: () => ({ items: [] }) });
      router.service(PrivateBareMetalInstanceTemplates, {
        list: () => ({ items: [makeTemplate('admin')] }),
      });
    });

    const { result } = renderWithTransport(
      () => useAdminBareMetalInstanceTemplates(),
      transport,
      'providerAdmin',
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject([makeTemplate('admin')]);
  });

  it('calls the public client for tenantAdmin', async () => {
    const transport = createRouterTransport((router) => {
      router.service(BareMetalInstanceTemplates, {
        list: () => ({ items: [makeTemplate('tenant')] }),
      });
      router.service(PrivateBareMetalInstanceTemplates, { list: () => ({ items: [] }) });
    });

    const { result } = renderWithTransport(
      () => useAdminBareMetalInstanceTemplates(),
      transport,
      'tenantAdmin',
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject([makeTemplate('tenant')]);
  });
});
