import { describe, expect, it } from 'vitest';

import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('My Cluster')).toBe('my-cluster');
  });

  it('strips characters not valid in an RFC 1035 DNS label', () => {
    expect(slugify('My_Cluster! v2.0')).toBe('my-cluster-v2-0');
  });

  it('collapses consecutive separators', () => {
    expect(slugify('a   b---c')).toBe('a-b-c');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('-leading and trailing-')).toBe('leading-and-trailing');
  });

  it('prefixes with a letter when the result would not start with one', () => {
    expect(slugify('123-cluster')).toBe('x-123-cluster');
  });

  it('truncates to 63 characters', () => {
    const longName = 'a'.repeat(100);
    expect(slugify(longName)).toHaveLength(63);
  });

  it('falls back to a default when the input has no valid characters', () => {
    expect(slugify('!!!')).toBe('item');
  });
});
