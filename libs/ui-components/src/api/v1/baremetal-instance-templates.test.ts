import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BareMetalInstanceTemplate } from '@osac/types';
import { BareMetalInstanceTemplates } from '@osac/types';

import { useBareMetalInstanceTemplate } from './baremetal-instance-templates';
import { renderHookWithProviders } from '../../test-utils/TestProviders';

const template: BareMetalInstanceTemplate = {
  $typeName: 'osac.public.v1.BareMetalInstanceTemplate',
  id: 'tpl-bm-worker',
  title: 'Bare Metal Worker',
  description: '',
  parameters: [],
};

describe('useBareMetalInstanceTemplate', () => {
  const createTestTransport = (onGet?: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(BareMetalInstanceTemplates, {
        get: (req) => {
          onGet?.(req);
          return { object: template };
        },
      });
    });

  it('fetches a single template by id from the Get endpoint', async () => {
    const transport = createTestTransport();
    const { result } = renderHookWithProviders(
      () => useBareMetalInstanceTemplate('tpl-bm-worker'),
      { role: 'tenantAdmin', transport },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject(template);
  });

  it('does not fetch when id is undefined', async () => {
    let getCalled = false;
    const transport = createTestTransport(() => {
      getCalled = true;
    });

    renderHookWithProviders(() => useBareMetalInstanceTemplate(undefined), {
      role: 'tenantAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCalled).toBe(false);
  });

  it('does not fetch when id is whitespace-only', async () => {
    let getCalled = false;
    const transport = createTestTransport(() => {
      getCalled = true;
    });

    renderHookWithProviders(() => useBareMetalInstanceTemplate('   '), {
      role: 'tenantAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCalled).toBe(false);
  });
});
