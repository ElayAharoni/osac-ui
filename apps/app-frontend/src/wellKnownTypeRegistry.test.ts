import { fromJson } from '@bufbuild/protobuf';
import { AnySchema } from '@bufbuild/protobuf/wkt';
import { describe, expect, it } from 'vitest';

import { wellKnownTypeRegistry } from './wellKnownTypeRegistry';

describe('wellKnownTypeRegistry', () => {
  it.each([
    ['google.protobuf.BoolValue', true],
    ['google.protobuf.StringValue', 'hello'],
    ['google.protobuf.Int32Value', 42],
    ['google.protobuf.Int64Value', '42'],
    ['google.protobuf.DoubleValue', 4.2],
    ['google.protobuf.Value', { nested: true }],
    ['google.protobuf.Struct', { nested: true }],
    ['google.protobuf.ListValue', [1, 2, 3]],
    ['google.protobuf.Timestamp', '2026-01-01T00:00:00Z'],
    ['google.protobuf.Duration', '5s'],
  ])('resolves %s packed in a google.protobuf.Any', (typeName, value) => {
    const decode = () =>
      fromJson(
        AnySchema,
        { '@type': `type.googleapis.com/${typeName}`, value },
        { registry: wellKnownTypeRegistry },
      );
    expect(decode).not.toThrow();
  });

  it('fails to resolve an Any-packed well-known type without the registry', () => {
    const decode = () =>
      fromJson(AnySchema, {
        '@type': 'type.googleapis.com/google.protobuf.BoolValue',
        value: true,
      });
    expect(decode).toThrow(/not in the type registry/);
  });
});
