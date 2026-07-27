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
  type ScopeValues,
  buildScopePayloadFields,
  initialScopeForRole,
} from '../../../components/catalogManagement/catalogItemScope';
import { CatalogItemWizardFooter } from '../../../components/catalogManagement/CatalogItemWizardFooter';
import {
  type FieldDefinitionValue,
  buildFieldDefinition,
  fieldDefinitionValueSchema,
} from '../../../components/catalogManagement/fieldDefinitions/fieldDefinitionValue';
import { VMAccessStep } from '../../../components/catalogManagement/steps/compute-instance/VMAccessStep';
import { VMConfigurationStep } from '../../../components/catalogManagement/steps/compute-instance/VMConfigurationStep';
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
  description: string;
  template: LabeledResourceRef;
  scope: ScopeValues;
  fieldDefinitions: {
    instance_type: FieldDefinitionValue<LabeledResourceRef>;
    cores: FieldDefinitionValue<string>;
    memory_gib: FieldDefinitionValue<string>;
    image: FieldDefinitionValue<string>;
    boot_disk: { size_gib: FieldDefinitionValue<string> };
    additional_disks: AdditionalDiskEntry[];
    run_strategy: FieldDefinitionValue<string>;
    user_data: FieldDefinitionValue<string>;
    is_windows: FieldDefinitionValue<boolean>;
    ssh_key: FieldDefinitionValue<string>;
  };
}

const createInitialValues = (
  role: ReturnType<typeof useSession>['role'],
): ComputeInstanceCatalogItemFormValues => ({
  title: '',
  description: '',
  template: EMPTY_LABELED_RESOURCE_REF,
  scope: initialScopeForRole(role),
  fieldDefinitions: {
    instance_type: { editable: true, default: EMPTY_LABELED_RESOURCE_REF },
    cores: { editable: true, default: '' },
    memory_gib: { editable: true, default: '' },
    image: { editable: true, default: '' },
    boot_disk: { size_gib: { editable: true, default: '' } },
    additional_disks: [],
    run_strategy: { editable: true, default: 'Always' },
    user_data: { editable: true, default: '' },
    is_windows: { editable: true, default: false },
    ssh_key: { editable: true, default: '' },
  },
});

const getStepValidationSchema = (stepId: VmStepId, t: TFunction) => {
  switch (stepId) {
    case 'general':
      return Yup.object({ title: Yup.string().required(t('Name is required')) });
    case 'configuration':
      return Yup.object({
        fieldDefinitions: Yup.object({
          cores: fieldDefinitionValueSchema(t),
          memory_gib: fieldDefinitionValueSchema(t),
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
const getFullFormValidationSchema = (t: TFunction) =>
  Yup.object({
    title: Yup.string().required(t('Name is required')),
    fieldDefinitions: Yup.object({
      cores: fieldDefinitionValueSchema(t),
      memory_gib: fieldDefinitionValueSchema(t),
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
  buildFieldDefinition('cores', t('Cores'), values.fieldDefinitions.cores),
  buildFieldDefinition('memory_gib', t('Memory (GiB)'), values.fieldDefinitions.memory_gib),
  buildFieldDefinition('image', t('Image'), values.fieldDefinitions.image),
  buildFieldDefinition(
    'boot_disk.size_gib',
    t('Boot Disk Size (GiB)'),
    values.fieldDefinitions.boot_disk.size_gib,
  ),
  buildFieldDefinition('run_strategy', t('Run Strategy'), values.fieldDefinitions.run_strategy),
  buildFieldDefinition('user_data', t('User Data'), values.fieldDefinitions.user_data),
  buildFieldDefinition('is_windows', t('Is Windows'), values.fieldDefinitions.is_windows),
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
    () => getStepValidationSchema(activeStepId, t),
    [activeStepId, t],
  );
  const fullFormSchema = useMemo(() => getFullFormValidationSchema(t), [t]);

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
          ...buildScopePayloadFields(values.scope, role, values.title),
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
