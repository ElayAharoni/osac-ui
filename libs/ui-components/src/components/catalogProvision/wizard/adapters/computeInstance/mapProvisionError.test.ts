import { describe, expect, it } from 'vitest';

import { mapComputeInstanceProvisionError } from './mapProvisionError';
import { createEmptyComputeInstanceValues } from './payload';

describe('mapComputeInstanceProvisionError', () => {
  it('attributes a boot-disk-tier-required rejection to the boot disk field', () => {
    const result = mapComputeInstanceProvisionError(
      new Error(
        'boot_disk.storage_tier is required but was not provided by user input, catalog item defaults, or template defaults',
      ),
      createEmptyComputeInstanceValues(),
    );

    expect(result).toEqual({
      kind: 'field',
      stepId: 'storage',
      fieldName: 'spec.bootDisk.storageTier',
      message:
        'boot_disk.storage_tier is required but was not provided by user input, catalog item defaults, or template defaults',
    });
  });

  it.each([0, 2])(
    'attributes an additional-disk-tier-required rejection to disk row %i',
    (index) => {
      const values = createEmptyComputeInstanceValues();
      values.spec.additionalDisks = Array.from({ length: index + 1 }, () => ({
        sizeGib: '100',
        storageTier: '',
      }));

      const result = mapComputeInstanceProvisionError(
        new Error(`additional_disks[${index}].storage_tier is required`),
        values,
      );

      expect(result).toEqual({
        kind: 'field',
        stepId: 'storage',
        fieldName: `spec.additionalDisks.${index}.storageTier`,
        message: `additional_disks[${index}].storage_tier is required`,
      });
    },
  );

  it('falls back to a banner when the required-additional-disk index is out of range for the current form', () => {
    const result = mapComputeInstanceProvisionError(
      new Error('additional_disks[3].storage_tier is required'),
      createEmptyComputeInstanceValues(),
    );

    expect(result).toEqual({
      kind: 'banner',
      message: 'additional_disks[3].storage_tier is required',
    });
  });

  it('attributes a tier-not-found rejection to the first disk row when the value is duplicated', () => {
    const values = createEmptyComputeInstanceValues();
    values.spec.additionalDisks = [
      { sizeGib: '100', storageTier: 'bulk' },
      { sizeGib: '200', storageTier: 'bulk' },
    ];

    const result = mapComputeInstanceProvisionError(
      new Error("storage tier 'bulk' does not exist"),
      values,
    );

    expect(result).toEqual({
      kind: 'field',
      stepId: 'storage',
      fieldName: 'spec.additionalDisks.0.storageTier',
      message: "storage tier 'bulk' does not exist",
    });
  });

  it('attributes a tier-not-found rejection to the boot disk field when its value matches', () => {
    const values = createEmptyComputeInstanceValues();
    values.spec.bootDisk.storageTier = 'fast';

    const result = mapComputeInstanceProvisionError(
      new Error("storage tier 'fast' does not exist"),
      values,
    );

    expect(result).toEqual({
      kind: 'field',
      stepId: 'storage',
      fieldName: 'spec.bootDisk.storageTier',
      message: "storage tier 'fast' does not exist",
    });
  });

  it('attributes a tier-not-found rejection (double-quoted) to the matching additional disk row', () => {
    const values = createEmptyComputeInstanceValues();
    values.spec.additionalDisks = [
      { sizeGib: '100', storageTier: 'bulk' },
      { sizeGib: '200', storageTier: 'archive' },
    ];

    const result = mapComputeInstanceProvisionError(
      new Error('storage tier "archive" does not exist'),
      values,
    );

    expect(result).toEqual({
      kind: 'field',
      stepId: 'storage',
      fieldName: 'spec.additionalDisks.1.storageTier',
      message: 'storage tier "archive" does not exist',
    });
  });

  it('falls back to a banner when a tier-not-found rejection matches no current field value', () => {
    const result = mapComputeInstanceProvisionError(
      new Error("storage tier 'ghost' does not exist"),
      createEmptyComputeInstanceValues(),
    );

    expect(result).toEqual({
      kind: 'banner',
      message: "storage tier 'ghost' does not exist",
    });
  });

  it('falls back to a banner for an unrelated INVALID_ARGUMENT message', () => {
    const result = mapComputeInstanceProvisionError(
      new Error('metadata.name must be a valid RFC 1035 label'),
      createEmptyComputeInstanceValues(),
    );

    expect(result).toEqual({
      kind: 'banner',
      message: 'metadata.name must be a valid RFC 1035 label',
    });
  });

  it('falls back to a banner for a non-Error rejection', () => {
    const result = mapComputeInstanceProvisionError('boom', createEmptyComputeInstanceValues());

    expect(result).toEqual({
      kind: 'banner',
      message: 'boom',
    });
  });
});
