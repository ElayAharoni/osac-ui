import { useField } from 'formik';

import { useOrganizations } from '../../api/v1/organization';
import { useProjects } from '../../api/v1/projects';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';
import { InputField } from '../Form/InputField';
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
  const { data: organizations = [] } = useOrganizations();
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
    <>
      <InputField name="title" label={t('Name')} fieldId="catalog-item-title" isRequired />
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
          options={organizations.map((organization) => ({
            value: organization.id,
            label: organization.metadata?.name || organization.id,
          }))}
          placeholder={t('Select an organization')}
        />
      ) : null}
      {role !== 'providerAdmin' && scopeLevelField.value === 'project' ? (
        <SelectField
          name="scope.project"
          label={t('Select project')}
          fieldId="catalog-item-scope-project"
          options={projects.map((project) => ({
            value: project.id,
            label: project.metadata?.name || project.id,
          }))}
          placeholder={t('Select a project')}
        />
      ) : null}
    </>
  );
};
