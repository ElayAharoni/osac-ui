import { useField } from 'formik';

import { usePrivateTenants } from '../../api/v1/private/tenant';
import { useProjects } from '../../api/v1/projects';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';
import { InputField } from '../Form/InputField';
import OsacForm from '../Form/OsacForm';
import { RadioButtonField } from '../Form/RadioButtonField';
import { SelectField, type SelectFieldOption } from '../Form/SelectField';

interface CatalogItemGeneralFieldsProps {
  templates: SelectFieldOption[];
  templatesLoading: boolean;
}

export const CatalogItemGeneralFields = ({
  templates,
  templatesLoading,
}: CatalogItemGeneralFieldsProps) => {
  const { t } = useTranslation();
  const { role } = useSession();
  const [scopeLevelField] = useField<string>('scope.level');
  // Only a CSP Admin ever sees the organization dropdown below — a Tenant Admin has no permission
  // to call the private Tenants API this hook uses, so it must stay disabled for that role.
  const { data: tenants = [] } = usePrivateTenants(role === 'providerAdmin');
  const { data: projects = [] } = useProjects();

  const scopeOptions =
    role === 'providerAdmin'
      ? [
          { value: 'general', label: t('General') },
          { value: 'organization', label: t('Organization') },
        ]
      : [
          { value: 'organization', label: t('Organization') },
          { value: 'project', label: t('Project') },
        ];

  return (
    <OsacForm>
      <InputField name="title" label={t('Title')} fieldId="catalog-item-title" />
      <InputField
        name="resourceName"
        label={t('Name')}
        fieldId="catalog-item-resource-name"
        isRequired
        helperText={t('Name must be a valid DNS label (RFC 1035).')}
      />
      <InputField
        name="description"
        label={t('Description')}
        fieldId="catalog-item-description"
        multiline
      />
      <SelectField
        name="template"
        label={t('Template')}
        fieldId="catalog-item-template"
        options={templates}
        isLoading={templatesLoading}
        placeholder={t('Select a template')}
        isRequired
      />
      <RadioButtonField
        name="scope.level"
        label={t('Scope')}
        fieldId="catalog-item-scope"
        options={scopeOptions}
        isInline
      />
      {role === 'providerAdmin' && scopeLevelField.value === 'organization' ? (
        <SelectField
          name="scope.tenant"
          label={t('Select organization')}
          fieldId="catalog-item-scope-tenant"
          options={tenants.map((tenant) => ({
            value: tenant.id,
            label: tenant.metadata?.name || tenant.id,
          }))}
          placeholder={t('Select an organization')}
          isRequired
        />
      ) : null}
      {role !== 'providerAdmin' && scopeLevelField.value === 'project' ? (
        <SelectField
          name="scope.project"
          label={t('Select project')}
          fieldId="catalog-item-scope-project-select"
          options={projects.map((project) => ({
            value: project.id,
            label: project.metadata?.name || project.id,
          }))}
          placeholder={t('Select a project')}
          isRequired
        />
      ) : null}
    </OsacForm>
  );
};
