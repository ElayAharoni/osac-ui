import React, { type ReactNode, createElement } from 'react';
import { createRouterTransport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Projects } from '@osac/types';

import { useProjects } from './projects';
import { ApiProvider } from '../api-context';

const makeProject = (id: string) => ({ id, metadata: { name: `project-${id}` } });

describe('useProjects', () => {
  it('lists projects', async () => {
    const transport = createRouterTransport((router) => {
      router.service(Projects, { list: () => ({ items: [makeProject('a')] }) });
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ApiProvider,
        { transport } as React.ComponentProps<typeof ApiProvider>,
        createElement(QueryClientProvider, { client: queryClient }, children),
      );

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject([makeProject('a')]);
  });
});
