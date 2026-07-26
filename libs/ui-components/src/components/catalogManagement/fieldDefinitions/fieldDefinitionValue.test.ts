import { describe, expect, it } from 'vitest';

import { buildFieldDefinition, fieldDefinitionValueSchema } from './fieldDefinitionValue';
import { tIdentity } from '../../../test-utils/i18n';

describe('buildFieldDefinition', () => {
  it('builds a field definition from a string default with no validation', () => {
    const result = buildFieldDefinition('release_image', 'Release Image', {
      editable: false,
      default: 'quay.io/openshift/release:latest',
    });

    expect(result.path).toBe('release_image');
    expect(result.displayName).toBe('Release Image');
    expect(result.editable).toBe(false);
    expect(result.validationSchema).toBe('');
    expect(result.default).toEqual({
      kind: { case: 'stringValue', value: 'quay.io/openshift/release:latest' },
    });
  });

  it('builds a field definition from a number default', () => {
    const result = buildFieldDefinition('cores', 'Cores', { editable: true, default: 4 });

    expect(result.default).toEqual({ kind: { case: 'numberValue', value: 4 } });
  });

  it('builds a field definition from a boolean default', () => {
    const result = buildFieldDefinition('is_windows', 'Is Windows', {
      editable: true,
      default: false,
    });

    expect(result.default).toEqual({ kind: { case: 'boolValue', value: false } });
  });

  it('serializes validation constraints as a JSON string', () => {
    const result = buildFieldDefinition('pod_cidr', 'Pod CIDR', {
      editable: true,
      default: '10.128.0.0/14',
      validation: { pattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$' },
    });

    expect(JSON.parse(result.validationSchema)).toEqual({
      pattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$',
    });
  });

  it('omits validationSchema when no validation is configured', () => {
    const result = buildFieldDefinition('user_data', 'User Data', {
      editable: true,
      default: '',
    });

    expect(result.validationSchema).toBe('');
  });
});

describe('fieldDefinitionValueSchema', () => {
  const schema = fieldDefinitionValueSchema(tIdentity);

  it('requires a default value when editable is false', async () => {
    await expect(schema.validate({ editable: false, default: '' })).rejects.toThrow(
      'Default value is required for non-editable fields',
    );
  });

  it('allows an empty default value when editable is true', async () => {
    await expect(schema.validate({ editable: true, default: '' })).resolves.toEqual({
      editable: true,
      default: '',
    });
  });

  it('passes when a non-editable field has a default value', async () => {
    await expect(schema.validate({ editable: false, default: 'value' })).resolves.toEqual({
      editable: false,
      default: 'value',
    });
  });
});
