import { ComputeInstanceRunStrategy } from '@osac/types';

/** VMs are always created in the running state; stop/start is handled on the details page. */
export const VM_CREATE_RUN_STRATEGY =
  ComputeInstanceRunStrategy.COMPUTE_INSTANCE_RUN_STRATEGY_ALWAYS;

export interface ComputeInstanceNetworkingValues {
  virtualNetwork: string;
  subnet: string;
  securityGroups: string[];
}

export interface ComputeInstanceDiskValues {
  sizeGib: string;
  /** Storage tier name; empty means "let the server or template default apply". */
  storageTier: string;
}

export interface ComputeInstanceWizardValues {
  catalogItemId: string;
  metadata: {
    name: string;
    project: string;
  };
  spec: {
    sshPublicKey: string;
    diskImage: string;
    instanceType: string;
    userData: string;
    bootDisk: ComputeInstanceDiskValues;
    additionalDisks: ComputeInstanceDiskValues[];
    networking: ComputeInstanceNetworkingValues;
  };
}

export const VM_SSH_KEY_WIRE_PATH = 'ssh_public_key';
export const VM_SSH_KEY_FORM_PATH = 'spec.sshPublicKey';
export const vmSshPublicKeyWirePath = VM_SSH_KEY_WIRE_PATH;

export const VM_DISK_IMAGE_WIRE_PATH = 'spec.disk_image';

export const CONFIGURATION_CATALOG_PATHS = [
  VM_DISK_IMAGE_WIRE_PATH,
  'spec.user_data',
  'spec.boot_disk.size_gib',
  'spec.boot_disk.storage_tier',
] as const;
