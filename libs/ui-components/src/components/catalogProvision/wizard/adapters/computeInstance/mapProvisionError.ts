import { getErrorMessage } from '../../../../../utils/error';
import type { ProvisionErrorResult } from '../types';
import type { ComputeInstanceWizardValues } from './fields';

// Anchored at the start: ConnectError.rawMessage passes the server's grpc-status
// message through verbatim (no wrapping prefix), so these fields always lead the
// message. Unanchored matching would misattribute an unrelated error that merely
// quotes this phrasing (e.g. in a longer explanatory message) to a form field.
const BOOT_TIER_REQUIRED_RE = /^boot_disk\.storage_tier is required\b/;
const ADDITIONAL_TIER_REQUIRED_RE = /^additional_disks\[(\d+)\]\.storage_tier is required\b/;
// Fully anchored: the backend's actual message (private_compute_instances_server.go)
// is exactly this string, nothing more.
const TIER_NOT_FOUND_RE = /^storage tier ['"]([^'"]+)['"] does not exist$/;

export const mapComputeInstanceProvisionError = (
  error: unknown,
  values: ComputeInstanceWizardValues,
): ProvisionErrorResult => {
  const message = getErrorMessage(error);

  if (BOOT_TIER_REQUIRED_RE.test(message)) {
    return { kind: 'field', stepId: 'storage', fieldName: 'spec.bootDisk.storageTier', message };
  }

  const additionalMatch = message.match(ADDITIONAL_TIER_REQUIRED_RE);
  if (additionalMatch) {
    const index = Number(additionalMatch[1]);
    if (index < values.spec.additionalDisks.length) {
      return {
        kind: 'field',
        stepId: 'storage',
        fieldName: `spec.additionalDisks.${index}.storageTier`,
        message,
      };
    }
  }

  const notFoundMatch = message.match(TIER_NOT_FOUND_RE);
  if (notFoundMatch) {
    const tierName = notFoundMatch[1];
    if (values.spec.bootDisk.storageTier === tierName) {
      return { kind: 'field', stepId: 'storage', fieldName: 'spec.bootDisk.storageTier', message };
    }
    const diskIndex = values.spec.additionalDisks.findIndex(
      (disk) => disk.storageTier === tierName,
    );
    if (diskIndex >= 0) {
      return {
        kind: 'field',
        stepId: 'storage',
        fieldName: `spec.additionalDisks.${diskIndex}.storageTier`,
        message,
      };
    }
  }

  return { kind: 'banner', message };
};
