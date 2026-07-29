import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type MessageInitShape } from '@bufbuild/protobuf';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  PageSection,
  PageSectionTypes,
  Stack,
  StackItem,
  Title,
  Wizard,
  WizardFooterWrapper,
  WizardStep,
} from '@patternfly/react-core';
import { FormikProvider, useFormik } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import { ComputeInstanceCatalogItemSchema } from '@osac/types';

import { useCreateComputeInstanceCatalogItem } from '../../../api/v1/compute-instance-catalog-item';
import { useAdminComputeInstanceTemplates } from '../../../api/v1/compute-instance-templates';
import { CatalogItemGeneralFields } from '../../../components/catalogManagement/CatalogItemGeneralFields';
import {
  resourceRefRequiredSchema,
  templateRequiredSchema,
} from '../../../components/catalogManagement/catalogItemGeneralSchema';
import {
  type ScopeValues,
  buildScopePayloadFields,
  initialScopeForRole,
  scopeValidationSchema,
} from '../../../components/catalogManagement/catalogItemScope';
import { CatalogItemWizardFooter } from '../../../components/catalogManagement/CatalogItemWizardFooter';
import {
  type FieldDefinitionValue,
  buildFieldDefinition,
  fieldDefinitionValueSchema,
} from '../../../components/catalogManagement/fieldDefinitions/fieldDefinitionValue';
import { VMAccessStep } from '../../../components/catalogManagement/steps/compute-instance/VMAccessStep';
import { VMConfigurationStep } from '../../../components/catalogManagement/steps/compute-instance/VMConfigurationStep';
import { buildMetadataNameSchema } from '../../../components/catalogProvision/wizard/metadataNameSchema';
import { FieldValidationProvider } from '../../../components/Form/FieldValidationContext';
import {
  EMPTY_LABELED_RESOURCE_REF,
  type LabeledResourceRef,
} from '../../../components/Form/labeledResourceRef';
import { useSession } from '../../../hooks/use-session';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';

const STEP_IDS = ['general', 'configuration', 'access'] as const;
type VmStepId = (typeof STEP_IDS)[number];

const STEP_LABEL_KEYS: Record<VmStepId, string> = {
  general: 'General',
  configuration: 'Configuration',
  access: 'Access',
};

interface AdditionalDiskEntry {
  rowId: string;
  size_gib: FieldDefinitionValue<string>;
}

interface ComputeInstanceCatalogItemFormValues {
  title: string;
  resourceName: string;
  description: string;
  template: LabeledResourceRef;
  scope: ScopeValues;
  fieldDefinitions: {
    instance_type: FieldDefinitionValue<LabeledResourceRef>;
    image: { source_ref: FieldDefinitionValue<string> };
    boot_disk: { size_gib: FieldDefinitionValue<string> };
    additional_disks: AdditionalDiskEntry[];
    run_strategy: FieldDefinitionValue<string>;
    user_data: FieldDefinitionValue<string>;
    ssh_key: FieldDefinitionValue<string>;
  };
}

const createInitialValues = (
  role: ReturnType<typeof useSession>['role'],
): ComputeInstanceCatalogItemFormValues => ({
  title: '',
  resourceName: '',
  description: '',
  template: EMPTY_LABELED_RESOURCE_REF,
  scope: initialScopeForRole(role),
  fieldDefinitions: {
    instance_type: { editable: true, default: EMPTY_LABELED_RESOURCE_REF },
    image: { source_ref: { editable: true, default: '' } },
    boot_disk: { size_gib: { editable: true, default: '' } },
    additional_disks: [],
    run_strategy: { editable: true, default: 'Always' },
    user_data: { editable: true, default: '' },
    ssh_key: { editable: true, default: '' },
  },
});

// instance_type's default is a LabeledResourceRef ({value, label}), not a scalar, so the generic
// fieldDefinitionValueSchema's required-default check (which only tests for `!== ''`) would pass
// trivially on an empty ref object. Require `.value` specifically, only when non-editable.
const instanceTypeFieldDefinitionSchema = (t: TFunction) =>
  Yup.object({
    editable: Yup.boolean().required(),
    default: Yup.object({ value: Yup.string() }).when('editable', {
      is: false,
      then: () => resourceRefRequiredSchema(t('Default value is required for non-editable fields')),
    }),
  });

const getStepValidationSchema = (
  stepId: VmStepId,
  t: TFunction,
  role: ReturnType<typeof useSession>['role'],
) => {
  switch (stepId) {
    case 'general':
      return Yup.object({
        title: Yup.string(),
        resourceName: buildMetadataNameSchema(t),
        template: templateRequiredSchema(t),
        scope: scopeValidationSchema(t, role),
      });
    case 'configuration':
      return Yup.object({
        fieldDefinitions: Yup.object({
          instance_type: instanceTypeFieldDefinitionSchema(t),
          boot_disk: Yup.object({ size_gib: fieldDefinitionValueSchema(t) }),
          additional_disks: Yup.array().of(Yup.object({ size_gib: fieldDefinitionValueSchema(t) })),
        }),
      });
    case 'access':
      return Yup.object({
        fieldDefinitions: Yup.object({ ssh_key: fieldDefinitionValueSchema(t) }),
      });
  }
};

// Validated once, in full, before the final submit — see CatalogItemWizardFooter.
const getFullFormValidationSchema = (t: TFunction, role: ReturnType<typeof useSession>['role']) =>
  Yup.object({
    title: Yup.string(),
    resourceName: buildMetadataNameSchema(t),
    template: templateRequiredSchema(t),
    scope: scopeValidationSchema(t, role),
    fieldDefinitions: Yup.object({
      instance_type: instanceTypeFieldDefinitionSchema(t),
      additional_disks: Yup.array().of(Yup.object({ size_gib: fieldDefinitionValueSchema(t) })),
      boot_disk: Yup.object({ size_gib: fieldDefinitionValueSchema(t) }),
      ssh_key: fieldDefinitionValueSchema(t),
    }),
  });

const buildFieldDefinitions = (values: ComputeInstanceCatalogItemFormValues, t: TFunction) => [
  // instance_type's default is a LabeledResourceRef ({value, label}); flatten to the id before
  // serializing, the same way `template` is flattened below — otherwise the display label leaks
  // into the wire payload as a struct instead of a plain string id.
  buildFieldDefinition('instance_type', t('Instance Type'), {
    editable: values.fieldDefinitions.instance_type.editable,
    default: values.fieldDefinitions.instance_type.default.value,
  }),
  buildFieldDefinition(
    'image.source_ref',
    t('Source Ref'),
    values.fieldDefinitions.image.source_ref,
  ),
  buildFieldDefinition(
    'boot_disk.size_gib',
    t('Boot Disk Size (GiB)'),
    values.fieldDefinitions.boot_disk.size_gib,
  ),
  buildFieldDefinition('run_strategy', t('Run Strategy'), values.fieldDefinitions.run_strategy),
  buildFieldDefinition('user_data', t('User Data'), values.fieldDefinitions.user_data),
  buildFieldDefinition('ssh_key', t('SSH Key'), values.fieldDefinitions.ssh_key),
  ...values.fieldDefinitions.additional_disks.map((disk, index) =>
    buildFieldDefinition(
      `additional_disks.${index}.size_gib`,
      t('Additional Disk Size (GiB)'),
      disk.size_gib,
    ),
  ),
  // Not shown in any wizard step — VM catalog items always allow tenants to configure network
  // attachments at provisioning time.
  buildFieldDefinition('network_attachments', t('Network Attachments'), {
    editable: true,
    default: [],
  }),
];

export const ComputeInstanceCatalogItemCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useSession();
  const { data: templates = [], isLoading: templatesLoading } = useAdminComputeInstanceTemplates();
  const { mutateAsync: createComputeInstanceCatalogItem, isPending } =
    useCreateComputeInstanceCatalogItem();
  const [activeStepId, setActiveStepId] = useState<VmStepId>('general');
  const [validationAlert, setValidationAlert] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const initialValues = useMemo(() => createInitialValues(role), [role]);
  const validationSchema = useMemo(
    () => getStepValidationSchema(activeStepId, t, role),
    [activeStepId, t, role],
  );
  const fullFormSchema = useMemo(() => getFullFormValidationSchema(t, role), [t, role]);

  const formik = useFormik<ComputeInstanceCatalogItemFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values) => {
      setSubmitError(undefined);
      try {
        const payload: MessageInitShape<typeof ComputeInstanceCatalogItemSchema> = {
          title: values.title.trim(),
          description: values.description.trim(),
          template: values.template.value,
          published: false,
          ...buildScopePayloadFields(values.scope, role, values.resourceName),
          // buildFieldDefinition()'s `default` is a decoded google.protobuf.Value init shape;
          // MessageInitShape can't structurally verify it against the generated Value type, so
          // this one property needs a cast (see buildFieldDefinition in fieldDefinitionValue.ts).
          fieldDefinitions: buildFieldDefinitions(values, t) as MessageInitShape<
            typeof ComputeInstanceCatalogItemSchema
          >['fieldDefinitions'],
        };
        await createComputeInstanceCatalogItem(payload);
        navigate('/admin/catalog');
      } catch (error) {
        setSubmitError(getErrorMessage(error));
      }
    },
  });

  const templateOptions = templates.map((template) => ({
    value: template.id,
    label: template.metadata?.name || template.id,
  }));

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/admin/catalog')}>
                {t('Catalog management')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create virtual machine catalog item')}
          </Title>
          <Content component="p">
            {t('Define a curated virtual machine offering for tenants to provision from.')}
          </Content>
        </Stack>
      </PageSection>
      <FormikProvider value={formik}>
        <PageSection hasBodyWrapper={false} type={PageSectionTypes.wizard}>
          <Wizard
            navAriaLabel={t('Create virtual machine catalog item steps')}
            isVisitRequired
            footer={
              <WizardFooterWrapper>
                <CatalogItemWizardFooter
                  formik={formik}
                  stepIds={STEP_IDS}
                  onActiveStepIdChange={(id) => setActiveStepId(id as VmStepId)}
                  fullFormSchema={fullFormSchema}
                  setValidationAlert={setValidationAlert}
                  isPending={isPending}
                />
              </WizardFooterWrapper>
            }
          >
            {STEP_IDS.map((stepId) => (
              <WizardStep key={stepId} id={stepId} name={t(STEP_LABEL_KEYS[stepId])}>
                <FieldValidationProvider value={validationAlert}>
                  <Stack hasGutter>
                    {validationAlert ? (
                      <StackItem>
                        <Alert
                          variant="danger"
                          isInline
                          title={t('This step has validation errors')}
                        />
                      </StackItem>
                    ) : null}
                    {submitError ? (
                      <StackItem>
                        <Alert variant="danger" isInline title={t('Could not create catalog item')}>
                          {submitError}
                        </Alert>
                      </StackItem>
                    ) : null}
                    {stepId === 'general' ? (
                      <CatalogItemGeneralFields
                        templates={templateOptions}
                        templatesLoading={templatesLoading}
                      />
                    ) : null}
                    {stepId === 'configuration' ? <VMConfigurationStep /> : null}
                    {stepId === 'access' ? <VMAccessStep /> : null}
                  </Stack>
                </FieldValidationProvider>
              </WizardStep>
            ))}
          </Wizard>
        </PageSection>
      </FormikProvider>
    </>
  );
};

export default ComputeInstanceCatalogItemCreatePage;
