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

import { BareMetalInstanceCatalogItemSchema } from '@osac/types';

import { useCreateBareMetalInstanceCatalogItem } from '../../../api/v1/baremetal-instance';
import { useAdminBareMetalInstanceTemplates } from '../../../api/v1/baremetal-instance-templates';
import { CatalogItemGeneralFields } from '../../../components/catalogManagement/CatalogItemGeneralFields';
import { templateRequiredSchema } from '../../../components/catalogManagement/catalogItemGeneralSchema';
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
import { BMAccessStep } from '../../../components/catalogManagement/steps/baremetal-instance/BMAccessStep';
import { BMConfigurationStep } from '../../../components/catalogManagement/steps/baremetal-instance/BMConfigurationStep';
import { FieldValidationProvider } from '../../../components/Form/FieldValidationContext';
import {
  EMPTY_LABELED_RESOURCE_REF,
  type LabeledResourceRef,
} from '../../../components/Form/labeledResourceRef';
import { useSession } from '../../../hooks/use-session';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';

const STEP_IDS = ['general', 'configuration', 'access'] as const;
type BareMetalStepId = (typeof STEP_IDS)[number];

const STEP_LABEL_KEYS: Record<BareMetalStepId, string> = {
  general: 'General',
  configuration: 'Configuration',
  access: 'Access',
};

interface BareMetalInstanceCatalogItemFormValues {
  title: string;
  description: string;
  template: LabeledResourceRef;
  scope: ScopeValues;
  fieldDefinitions: {
    run_strategy: FieldDefinitionValue<string>;
    user_data: FieldDefinitionValue<string>;
    ssh_public_key: FieldDefinitionValue<string>;
  };
}

const createInitialValues = (
  role: ReturnType<typeof useSession>['role'],
): BareMetalInstanceCatalogItemFormValues => ({
  title: '',
  description: '',
  template: EMPTY_LABELED_RESOURCE_REF,
  scope: initialScopeForRole(role),
  fieldDefinitions: {
    run_strategy: { editable: true, default: 'ALWAYS' },
    user_data: { editable: true, default: '' },
    ssh_public_key: { editable: true, default: '' },
  },
});

const getStepValidationSchema = (
  stepId: BareMetalStepId,
  t: TFunction,
  role: ReturnType<typeof useSession>['role'],
) => {
  switch (stepId) {
    case 'general':
      return Yup.object({
        title: Yup.string().required(t('Name is required')),
        template: templateRequiredSchema(t),
        scope: scopeValidationSchema(t, role),
      });
    case 'configuration':
      return Yup.object({
        fieldDefinitions: Yup.object({
          run_strategy: fieldDefinitionValueSchema(t),
          user_data: fieldDefinitionValueSchema(t),
        }),
      });
    case 'access':
      return Yup.object({
        fieldDefinitions: Yup.object({ ssh_public_key: fieldDefinitionValueSchema(t) }),
      });
  }
};

// Validated once, in full, before the final submit — see CatalogItemWizardFooter.
const getFullFormValidationSchema = (t: TFunction, role: ReturnType<typeof useSession>['role']) =>
  Yup.object({
    title: Yup.string().required(t('Name is required')),
    template: templateRequiredSchema(t),
    scope: scopeValidationSchema(t, role),
    fieldDefinitions: Yup.object({
      run_strategy: fieldDefinitionValueSchema(t),
      user_data: fieldDefinitionValueSchema(t),
      ssh_public_key: fieldDefinitionValueSchema(t),
    }),
  });

const buildFieldDefinitions = (values: BareMetalInstanceCatalogItemFormValues, t: TFunction) => [
  buildFieldDefinition('run_strategy', t('Run Strategy'), values.fieldDefinitions.run_strategy),
  buildFieldDefinition('user_data', t('User Data'), values.fieldDefinitions.user_data),
  buildFieldDefinition(
    'ssh_public_key',
    t('SSH Public Key'),
    values.fieldDefinitions.ssh_public_key,
  ),
];

export const BareMetalInstanceCatalogItemCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useSession();
  const { data: templates = [], isLoading: templatesLoading } =
    useAdminBareMetalInstanceTemplates();
  const { mutateAsync: createBareMetalInstanceCatalogItem, isPending } =
    useCreateBareMetalInstanceCatalogItem();
  const [activeStepId, setActiveStepId] = useState<BareMetalStepId>('general');
  const [validationAlert, setValidationAlert] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const initialValues = useMemo(() => createInitialValues(role), [role]);
  const validationSchema = useMemo(
    () => getStepValidationSchema(activeStepId, t, role),
    [activeStepId, t, role],
  );
  const fullFormSchema = useMemo(() => getFullFormValidationSchema(t, role), [t, role]);

  const formik = useFormik<BareMetalInstanceCatalogItemFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values) => {
      setSubmitError(undefined);
      try {
        const payload: MessageInitShape<typeof BareMetalInstanceCatalogItemSchema> = {
          title: values.title.trim(),
          description: values.description.trim(),
          template: values.template.value,
          published: false,
          ...buildScopePayloadFields(values.scope, role, values.title),
          // buildFieldDefinition()'s `default` is a decoded google.protobuf.Value init shape;
          // MessageInitShape can't structurally verify it against the generated Value type, so
          // this one property needs a cast (see buildFieldDefinition in fieldDefinitionValue.ts).
          fieldDefinitions: buildFieldDefinitions(values, t) as MessageInitShape<
            typeof BareMetalInstanceCatalogItemSchema
          >['fieldDefinitions'],
        };
        await createBareMetalInstanceCatalogItem(payload);
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
            {t('Create bare metal catalog item')}
          </Title>
          <Content component="p">
            {t('Define a curated bare metal offering for tenants to provision from.')}
          </Content>
        </Stack>
      </PageSection>
      <FormikProvider value={formik}>
        <PageSection hasBodyWrapper={false} type={PageSectionTypes.wizard}>
          <Wizard
            navAriaLabel={t('Create bare metal catalog item steps')}
            isVisitRequired
            footer={
              <WizardFooterWrapper>
                <CatalogItemWizardFooter
                  formik={formik}
                  stepIds={STEP_IDS}
                  onActiveStepIdChange={(id) => setActiveStepId(id as BareMetalStepId)}
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
                    {stepId === 'configuration' ? <BMConfigurationStep /> : null}
                    {stepId === 'access' ? <BMAccessStep /> : null}
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

export default BareMetalInstanceCatalogItemCreatePage;
