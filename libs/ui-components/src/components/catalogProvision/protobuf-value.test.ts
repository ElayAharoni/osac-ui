import { describe, expect, it } from 'vitest';

import { plainToProtobufValue, protobufValueToPlain } from './protobuf-value';

describe('plainToProtobufValue', () => {
  it.each([
    ['hello', 'stringValue'],
    ['', 'stringValue'],
    [42, 'numberValue'],
    [0, 'numberValue'],
    [true, 'boolValue'],
    [false, 'boolValue'],
    [null, 'nullValue'],
    [undefined, 'nullValue'],
  ])('encodes %j as kind.case %s', (value, expectedCase) => {
    const encoded = plainToProtobufValue(value) as { kind: { case: string } };
    expect(encoded.kind.case).toBe(expectedCase);
  });

  it('encodes arrays as a listValue', () => {
    const encoded = plainToProtobufValue([1, 'two', true]) as {
      kind: { case: string; value: { values: unknown[] } };
    };
    expect(encoded.kind.case).toBe('listValue');
    expect(encoded.kind.value.values).toHaveLength(3);
  });

  it('encodes plain objects as a structValue', () => {
    const encoded = plainToProtobufValue({ a: 1, b: 'two' }) as {
      kind: { case: string; value: { fields: Record<string, unknown> } };
    };
    expect(encoded.kind.case).toBe('structValue');
    expect(Object.keys(encoded.kind.value.fields)).toEqual(['a', 'b']);
  });
});

describe('plainToProtobufValue / protobufValueToPlain round trip', () => {
  it.each([['hello'], [42], [0], [true], [false], [null]])('round-trips scalar %j', (value) => {
    expect(protobufValueToPlain(plainToProtobufValue(value))).toEqual(value);
  });

  it('round-trips an array', () => {
    const value = [1, 'two', true];
    expect(protobufValueToPlain(plainToProtobufValue(value))).toEqual(value);
  });

  it('round-trips a plain object', () => {
    const value = { cores: 4, name: 'default', enabled: true };
    expect(protobufValueToPlain(plainToProtobufValue(value))).toEqual(value);
  });

  it('round-trips a nested structure (object containing an array of objects)', () => {
    const value = { nodeSets: [{ hostType: 'small', size: 3 }] };
    expect(protobufValueToPlain(plainToProtobufValue(value))).toEqual(value);
  });
});
