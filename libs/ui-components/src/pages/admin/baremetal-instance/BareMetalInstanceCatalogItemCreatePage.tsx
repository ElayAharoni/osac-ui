import { useLayoutEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  Flex,
  PageSection,
  PageSectionTypes,
  Stack,
  StackItem,
  Title,
  Wizard,
  WizardFooterWrapper,
  WizardStep,
  useWizardContext,
} from '@patternfly/react-core';
import { type FormikProps, FormikProvider, useFormik } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import { useCreateBareMetalInstanceCatalogItem } from '../../../api/v1/baremetal-instance';
import { useAdminBareMetalInstanceTemplates } from '../../../api/v1/baremetal-instance-templates';
import { CatalogItemGeneralFields } from '../../../components/catalogManagement/CatalogItemGeneralFields';
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
import { slugify } from '../../../utils/slug';

const STEP_IDS = ['general', 'configuration', 'access'] as const;
type BareMetalStepId = (typeof STEP_IDS)[number];

const STEP_LABEL_KEYS: Record<BareMetalStepId, string> = {
  general: 'General',
  configuration: 'Configuration',
  access: 'Access',
};

const isStepId = (id: string | number | undefined): id is BareMetalStepId =>
  typeof id === 'string' && (STEP_IDS as readonly string[]).includes(id);

interface ScopeValues {
  level: string;
  tenant: LabeledResourceRef;
  project: LabeledResourceRef;
}

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

const initialValues: BareMetalInstanceCatalogItemFormValues = {
  title: '',
  description: '',
  template: EMPTY_LABELED_RESOURCE_REF,
  scope: {
    level: 'general',
    tenant: EMPTY_LABELED_RESOURCE_REF,
    project: EMPTY_LABELED_RESOURCE_REF,
  },
  fieldDefinitions: {
    run_strategy: { editable: true, default: 'ALWAYS' },
    user_data: { editable: true, default: '' },
    ssh_public_key: { editable: true, default: '' },
  },
};

const getStepValidationSchema = (stepId: BareMetalStepId, t: TFunction) => {
  switch (stepId) {
    case 'general':
      return Yup.object({ title: Yup.string().required(t('Name is required')) });
    case 'configuration':
      return Yup.object({
        fieldDefinitions: Yup.object({ run_strategy: fieldDefinitionValueSchema(t) }),
      });
    case 'access':
      return Yup.object({
        fieldDefinitions: Yup.object({ ssh_public_key: fieldDefinitionValueSchema(t) }),
      });
  }
};

const buildFieldDefinitions = (values: BareMetalInstanceCatalogItemFormValues, t: TFunction) => [
  buildFieldDefinition('run_strategy', t('Run Strategy'), values.fieldDefinitions.run_strategy),
  buildFieldDefinition('user_data', t('User Data'), values.fieldDefinitions.user_data),
  buildFieldDefinition(
    'ssh_public_key',
    t('SSH Public Key'),
    values.fieldDefinitions.ssh_public_key,
  ),
];

interface FooterProps {
  formik: FormikProps<BareMetalInstanceCatalogItemFormValues>;
  setActiveStepId: (stepId: BareMetalStepId) => void;
  setValidationAlert: (visible: boolean) => void;
  isPending: boolean;
}

const BareMetalInstanceCatalogItemWizardFooter = ({
  formik,
  setActiveStepId,
  setValidationAlert,
  isPending,
}: FooterProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeStep, goToStepByIndex } = useWizardContext();
  const activeStepId = isStepId(activeStep?.id) ? activeStep.id : 'general';

  useLayoutEffect(() => {
    setActiveStepId(activeStepId);
  }, [activeStepId, setActiveStepId]);

  const stepIndex = activeStep?.index ?? 1;
  const isFirst = stepIndex <= 1;
  const isLast = activeStepId === 'access';

  const handleBack = () => {
    if (isFirst || isPending) {
      return;
    }
    setValidationAlert(false);
    goToStepByIndex(stepIndex - 1);
  };

  const handleNextOrSubmit = () => {
    if (isPending) {
      return;
    }
    void formik.validateForm().then((errors) => {
      if (Object.keys(errors).length > 0) {
        setValidationAlert(true);
        return;
      }
      setValidationAlert(false);
      if (isLast) {
        void formik.submitForm();
      } else {
        goToStepByIndex(stepIndex + 1);
      }
    });
  };

  return (
    <Flex
      justifyContent={{ default: 'justifyContentFlexStart' }}
      alignItems={{ default: 'alignItemsCenter' }}
      gap={{ default: 'gapMd' }}
    >
      <Button variant="secondary" onClick={handleBack} isDisabled={isFirst || isPending}>
        {t('Back')}
      </Button>
      <Button
        variant="primary"
        onClick={handleNextOrSubmit}
        isDisabled={isPending}
        isLoading={isPending && isLast}
      >
        {isLast ? t('Create') : t('Next')}
      </Button>
      <Button variant="link" onClick={() => navigate('/admin/catalog')} isDisabled={isPending}>
        {t('Cancel')}
      </Button>
    </Flex>
  );
};

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

  const validationSchema = useMemo(
    () => getStepValidationSchema(activeStepId, t),
    [activeStepId, t],
  );

  const formik = useFormik<BareMetalInstanceCatalogItemFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values) => {
      setSubmitError(undefined);
      try {
        await createBareMetalInstanceCatalogItem({
          title: values.title.trim(),
          description: values.description.trim(),
          template: values.template.value,
          published: false,
          ...(role === 'providerAdmin'
            ? {
                tenant: values.scope.level === 'organization' ? values.scope.tenant.value : '',
                metadata: { name: slugify(values.title) },
              }
            : {
                metadata: {
                  name: slugify(values.title),
                  project: values.scope.level === 'project' ? values.scope.project.value : '',
                },
              }),
          fieldDefinitions: buildFieldDefinitions(values, t),
        } as Parameters<typeof createBareMetalInstanceCatalogItem>[0]);
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
                <BareMetalInstanceCatalogItemWizardFooter
                  formik={formik}
                  setActiveStepId={setActiveStepId}
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
