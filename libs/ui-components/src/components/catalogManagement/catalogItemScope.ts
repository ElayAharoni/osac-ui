import type { DemoShellRole } from '../../shellTypes';
import { slugifyUnique } from '../../utils/slug';
import { EMPTY_LABELED_RESOURCE_REF, type LabeledResourceRef } from '../Form/labeledResourceRef';

export interface ScopeValues {
  level: string;
  tenant: LabeledResourceRef;
  project: LabeledResourceRef;
}

/** CSP Admin's scope options start at 'general'; Tenant Admin has no 'general' option, so their default must be 'organization'. */
export const initialScopeForRole = (role: DemoShellRole): ScopeValues => ({
  level: role === 'providerAdmin' ? 'general' : 'organization',
  tenant: EMPTY_LABELED_RESOURCE_REF,
  project: EMPTY_LABELED_RESOURCE_REF,
});

export const buildScopePayloadFields = (scope: ScopeValues, role: DemoShellRole, title: string) => {
  // slugifyUnique(), not slugify(): near-identical titles ("My VM" / "My VM!") would otherwise
  // collide on the same resource name and fail server-side with an opaque "already exists" error.
  const name = slugifyUnique(title);
  return role === 'providerAdmin'
    ? {
        tenant: scope.level === 'organization' ? scope.tenant.value : '',
        metadata: { name },
      }
    : {
        metadata: {
          name,
          project: scope.level === 'project' ? scope.project.value : '',
        },
      };
};
