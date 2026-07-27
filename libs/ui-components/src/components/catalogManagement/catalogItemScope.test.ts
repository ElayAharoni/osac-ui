import { describe, expect, it } from 'vitest';

import { buildScopePayloadFields, initialScopeForRole } from './catalogItemScope';

describe('initialScopeForRole', () => {
  it('defaults to general for a CSP Admin', () => {
    expect(initialScopeForRole('providerAdmin').level).toBe('general');
  });

  it('defaults to organization for a Tenant Admin', () => {
    expect(initialScopeForRole('tenantAdmin').level).toBe('organization');
  });
});

describe('buildScopePayloadFields', () => {
  it('sends tenant for a CSP Admin scoped to an organization', () => {
    const scope = {
      level: 'organization',
      tenant: { value: 'acme', label: 'Acme' },
      project: { value: '', label: '' },
    };
    const result = buildScopePayloadFields(scope, 'providerAdmin', 'My Cluster');

    expect(result.tenant).toBe('acme');
    expect(result.metadata.name).toContain('my-cluster');
  });

  it('sends an empty tenant for a CSP Admin scoped to general', () => {
    const scope = {
      level: 'general',
      tenant: { value: 'acme', label: 'Acme' },
      project: { value: '', label: '' },
    };
    const result = buildScopePayloadFields(scope, 'providerAdmin', 'My Cluster');

    expect(result.tenant).toBe('');
  });

  it('sends metadata.project for a Tenant Admin scoped to a project', () => {
    const scope = {
      level: 'project',
      tenant: { value: '', label: '' },
      project: { value: 'proj-1', label: 'Project One' },
    };
    const result = buildScopePayloadFields(scope, 'tenantAdmin', 'My Cluster');

    expect(result.metadata.project).toBe('proj-1');
    expect(result.metadata.name).toContain('my-cluster');
  });

  it('sends an empty metadata.project for a Tenant Admin scoped to organization', () => {
    const scope = {
      level: 'organization',
      tenant: { value: '', label: '' },
      project: { value: 'proj-1', label: 'Project One' },
    };
    const result = buildScopePayloadFields(scope, 'tenantAdmin', 'My Cluster');

    expect(result.metadata.project).toBe('');
  });
});
