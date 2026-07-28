import { describe, expect, it } from 'vitest';

import { catalogItemProvisionedResourcesFilter, escapeCelStringLiteral } from './cel';

describe('escapeCelStringLiteral', () => {
  it('escapes embedded quotes for CEL string literals', () => {
    expect(escapeCelStringLiteral('say "hello"')).toBe('say \\"hello\\"');
  });

  it('escapes backslashes for CEL string literals', () => {
    expect(escapeCelStringLiteral('path\\to\\thing')).toBe('path\\\\to\\\\thing');
  });
});

describe('catalogItemProvisionedResourcesFilter', () => {
  it('filters resources by catalog item id', () => {
    expect(catalogItemProvisionedResourcesFilter('catalog-1')).toBe(
      'this.spec.catalog_item == "catalog-1"',
    );
  });

  it('escapes CEL injection characters in the catalog item id', () => {
    expect(catalogItemProvisionedResourcesFilter(`"'] || true || this.id in ['`)).toBe(
      `this.spec.catalog_item == "\\"'] || true || this.id in ['"`,
    );
  });
});
