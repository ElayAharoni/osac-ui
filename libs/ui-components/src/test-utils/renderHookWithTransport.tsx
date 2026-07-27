import type { ReactNode } from 'react';
import type { Transport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

import { ApiProvider } from '../api/api-context';
import { SessionProvider } from '../hooks/use-session';
import type { DemoShellRole } from '../shellTypes';

/** Shared `renderHook` wrapper for API hook tests: ApiProvider + a query/mutation-safe QueryClient, with an optional SessionProvider when the hook under test is role-aware. */
export const renderHookWithTransport = <TResult,>(
  hook: () => TResult,
  transport: Transport,
  role?: DemoShellRole,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => {
    const withApi = (
      <ApiProvider transport={transport}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiProvider>
    );
    return role ? (
      <SessionProvider role={role} username="test-user">
        {withApi}
      </SessionProvider>
    ) : (
      withApi
    );
  };
  return renderHook(hook, { wrapper });
};
