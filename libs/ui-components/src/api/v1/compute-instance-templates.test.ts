import { createRouterTransport } from '@connectrpc/connect';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ComputeInstanceTemplate } from '@osac/types';
import { ComputeInstanceTemplates } from '@osac/types';

import { useComputeInstanceTemplate } from './compute-instance-templates';
import { renderHookWithProviders } from '../../test-utils/TestProviders';

const template: ComputeInstanceTemplate = {
  $typeName: 'osac.public.v1.ComputeInstanceTemplate',
  id: 'tpl-rhel-9',
  title: 'RHEL 9',
  description: '',
  parameters: [],
};

describe('useComputeInstanceTemplate', () => {
  const createTestTransport = (onGet?: (req: unknown) => void) =>
    createRouterTransport((router) => {
      router.service(ComputeInstanceTemplates, {
        get: (req) => {
          onGet?.(req);
          return { object: template };
        },
      });
    });

  it('fetches a single template by id from the Get endpoint', async () => {
    const transport = createTestTransport();
    const { result } = renderHookWithProviders(() => useComputeInstanceTemplate('tpl-rhel-9'), {
      role: 'tenantAdmin',
      transport,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject(template);
  });

  it('does not fetch when id is undefined', async () => {
    let getCalled = false;
    const transport = createTestTransport(() => {
      getCalled = true;
    });

    renderHookWithProviders(() => useComputeInstanceTemplate(undefined), {
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

    renderHookWithProviders(() => useComputeInstanceTemplate('   '), {
      role: 'tenantAdmin',
      transport,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCalled).toBe(false);
  });
});
