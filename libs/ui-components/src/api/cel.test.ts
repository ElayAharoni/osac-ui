import { describe, expect, it } from 'vitest';

import { escapeCelStringLiteral } from './cel';

describe('escapeCelStringLiteral', () => {
  it('escapes embedded quotes for CEL string literals', () => {
    expect(escapeCelStringLiteral('say "hello"')).toBe('say \\"hello\\"');
  });

  it('escapes backslashes for CEL string literals', () => {
    expect(escapeCelStringLiteral('path\\to\\thing')).toBe('path\\\\to\\\\thing');
  });
});
