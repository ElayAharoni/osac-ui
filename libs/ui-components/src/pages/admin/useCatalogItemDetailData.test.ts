import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCatalogItemDetailData } from './useCatalogItemDetailData';
import { mockQueryResult } from '../../test-utils/query';

describe('useCatalogItemDetailData', () => {
  it('uses the public hook and skips the private hook for a non-providerAdmin role', () => {
    const usePublicItem = vi.fn().mockReturnValue(mockQueryResult({ data: { template: 'tpl-1' } }));
    const usePrivateItem = vi.fn().mockReturnValue(mockQueryResult({ data: undefined }));
    const useTemplate = vi.fn().mockReturnValue(mockQueryResult({ data: { title: 'Template 1' } }));

    const { result } = renderHook(() =>
      useCatalogItemDetailData({
        id: 'catalog-1',
        role: 'tenantAdmin',
        usePublicItem,
        usePrivateItem,
        useTemplate,
      }),
    );

    expect(usePublicItem).toHaveBeenCalledWith('catalog-1');
    expect(usePrivateItem).toHaveBeenCalledWith(undefined);
    expect(useTemplate).toHaveBeenCalledWith('tpl-1');
    expect(result.current.data).toEqual({ template: 'tpl-1' });
    expect(result.current.template).toEqual({ title: 'Template 1' });
  });

  it('uses the private hook and skips the public hook for providerAdmin', () => {
    const usePublicItem = vi.fn().mockReturnValue(mockQueryResult({ data: undefined }));
    const usePrivateItem = vi
      .fn()
      .mockReturnValue(mockQueryResult({ data: { template: 'tpl-2' } }));
    const useTemplate = vi.fn().mockReturnValue(mockQueryResult({ data: undefined }));

    const { result } = renderHook(() =>
      useCatalogItemDetailData({
        id: 'catalog-2',
        role: 'providerAdmin',
        usePublicItem,
        usePrivateItem,
        useTemplate,
      }),
    );

    expect(usePublicItem).toHaveBeenCalledWith(undefined);
    expect(usePrivateItem).toHaveBeenCalledWith('catalog-2');
    expect(useTemplate).toHaveBeenCalledWith('tpl-2');
    expect(result.current.data).toEqual({ template: 'tpl-2' });
  });
});
