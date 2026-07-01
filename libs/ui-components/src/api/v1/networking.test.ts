import { describe, expect, it } from 'vitest';

import { SubnetSchema, VirtualNetworkSchema } from '@osac/types';

import { decodeFulfillmentResponse } from '../fulfillment-decode';

describe('virtualNetwork create response decode', () => {
  it('decodes the unwrapped REST create body as a VirtualNetwork', () => {
    const payload = {
      id: '019f0d21-d4c2-7102-9cde-4a909ca1c070',
      metadata: { name: 'vn-prod' },
      spec: {
        ipv4_cidr: '10.0.0.0/16',
      },
      status: { state: 'VIRTUAL_NETWORK_STATE_PENDING' },
    };

    const decoded = decodeFulfillmentResponse(VirtualNetworkSchema, payload) as {
      id: string;
      metadata?: { name?: string };
    };

    expect(decoded.id).toBe('019f0d21-d4c2-7102-9cde-4a909ca1c070');
    expect(decoded.metadata?.name).toBe('vn-prod');
  });
});

describe('subnet create response decode', () => {
  it('decodes the unwrapped REST create body as a Subnet', () => {
    const payload = {
      id: '019f0d21-d4c2-7102-9cde-4a909ca1c071',
      metadata: { name: 'subnet-web' },
      spec: {
        virtual_network: '019f0d21-d4c2-7102-9cde-4a909ca1c070',
        ipv4_cidr: '10.0.1.0/24',
      },
      status: { state: 'SUBNET_STATE_PENDING' },
    };

    const decoded = decodeFulfillmentResponse(SubnetSchema, payload) as {
      id: string;
      metadata?: { name?: string };
    };

    expect(decoded.id).toBe('019f0d21-d4c2-7102-9cde-4a909ca1c071');
    expect(decoded.metadata?.name).toBe('subnet-web');
  });
});
