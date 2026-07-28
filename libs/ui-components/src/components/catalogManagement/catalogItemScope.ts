import type { TFunction } from 'i18next';
import * as Yup from 'yup';

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

/**
 * Requires picking an organization/project once the corresponding scope level is selected — the
 * dropdown for it only renders for the matching role (see CatalogItemGeneralFields), so a CSP Admin
 * is only ever asked for `tenant` and a Tenant Admin only ever asked for `project`.
 */
export const scopeValidationSchema = (t: TFunction, role: DemoShellRole) =>
  Yup.object({
    tenant: Yup.object({ value: Yup.string() }).test(
      'organization-selected',
      t('Organization is required'),
      function (tenant) {
        const level = (this.parent as ScopeValues).level;
        if (role !== 'providerAdmin' || level !== 'organization') {
          return true;
        }
        return Boolean(tenant?.value?.trim());
      },
    ),
    project: Yup.object({ value: Yup.string() }).test(
      'project-selected',
      t('Project is required'),
      function (project) {
        const level = (this.parent as ScopeValues).level;
        if (role === 'providerAdmin' || level !== 'project') {
          return true;
        }
        return Boolean(project?.value?.trim());
      },
    ),
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
