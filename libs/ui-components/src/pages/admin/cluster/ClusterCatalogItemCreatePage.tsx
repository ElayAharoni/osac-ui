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

import { useCreateClusterCatalogItem } from '../../../api/v1/cluster-catalog-item';
import { useAdminClusterTemplates } from '../../../api/v1/cluster-templates';
import { CatalogItemGeneralFields } from '../../../components/catalogManagement/CatalogItemGeneralFields';
import {
  type FieldDefinitionValue,
  buildFieldDefinition,
  fieldDefinitionValueSchema,
} from '../../../components/catalogManagement/fieldDefinitions/fieldDefinitionValue';
import type { NodeSetsFieldValue } from '../../../components/catalogManagement/fieldDefinitions/NodeSetsFieldEditor';
import { ClusterAccessStep } from '../../../components/catalogManagement/steps/cluster/ClusterAccessStep';
import { ClusterConfigurationStep } from '../../../components/catalogManagement/steps/cluster/ClusterConfigurationStep';
import { ClusterNetworkingStep } from '../../../components/catalogManagement/steps/cluster/ClusterNetworkingStep';
import { FieldValidationProvider } from '../../../components/Form/FieldValidationContext';
import {
  EMPTY_LABELED_RESOURCE_REF,
  type LabeledResourceRef,
} from '../../../components/Form/labeledResourceRef';
import { useSession } from '../../../hooks/use-session';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import { slugify } from '../../../utils/slug';

const STEP_IDS = ['general', 'configuration', 'networking', 'access'] as const;
type ClusterStepId = (typeof STEP_IDS)[number];

const STEP_LABEL_KEYS: Record<ClusterStepId, string> = {
  general: 'General',
  configuration: 'Configuration',
  networking: 'Networking',
  access: 'Access',
};

const isStepId = (id: string | number | undefined): id is ClusterStepId =>
  typeof id === 'string' && (STEP_IDS as readonly string[]).includes(id);

interface ScopeValues {
  level: string;
  tenant: LabeledResourceRef;
  project: LabeledResourceRef;
}

interface ClusterCatalogItemFormValues {
  title: string;
  description: string;
  template: LabeledResourceRef;
  scope: ScopeValues;
  fieldDefinitions: {
    release_image: FieldDefinitionValue<string>;
    node_sets: NodeSetsFieldValue;
    network: {
      pod_cidr: FieldDefinitionValue<string>;
      service_cidr: FieldDefinitionValue<string>;
    };
    ssh_public_key: FieldDefinitionValue<string>;
    pull_secret: FieldDefinitionValue<string>;
  };
}

const CIDR_PATTERN = '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$';
const SSH_PUBLIC_KEY_PATTERN =
  '^(ssh-rsa|ecdsa-sha2-nistp(256|384|521)|ssh-ed25519) AAAA[0-9A-Za-z+/]+[=]{0,3}( .*)?$';

const initialValues: ClusterCatalogItemFormValues = {
  title: '',
  description: '',
  template: EMPTY_LABELED_RESOURCE_REF,
  scope: {
    level: 'general',
    tenant: EMPTY_LABELED_RESOURCE_REF,
    project: EMPTY_LABELED_RESOURCE_REF,
  },
  fieldDefinitions: {
    release_image: { editable: true, default: '' },
    node_sets: {
      entries: [{ rowId: crypto.randomUUID(), hostType: EMPTY_LABELED_RESOURCE_REF, size: '' }],
      editable: true,
      allowAddRemove: true,
    },
    network: {
      pod_cidr: { editable: true, default: '', validation: { pattern: CIDR_PATTERN } },
      service_cidr: { editable: true, default: '', validation: { pattern: CIDR_PATTERN } },
    },
    ssh_public_key: {
      editable: true,
      default: '',
      validation: { pattern: SSH_PUBLIC_KEY_PATTERN },
    },
    pull_secret: { editable: true, default: '' },
  },
};

const getStepValidationSchema = (stepId: ClusterStepId, t: TFunction) => {
  switch (stepId) {
    case 'general':
      return Yup.object({
        title: Yup.string().required(t('Name is required')),
      });
    case 'configuration':
      return Yup.object({
        fieldDefinitions: Yup.object({ release_image: fieldDefinitionValueSchema(t) }),
      });
    case 'networking':
      return Yup.object({
        fieldDefinitions: Yup.object({
          network: Yup.object({
            pod_cidr: fieldDefinitionValueSchema(t),
            service_cidr: fieldDefinitionValueSchema(t),
          }),
        }),
      });
    case 'access':
      return Yup.object({
        fieldDefinitions: Yup.object({
          ssh_public_key: fieldDefinitionValueSchema(t),
          pull_secret: fieldDefinitionValueSchema(t),
        }),
      });
  }
};

const parseOptionalNumber = (value: string | undefined): number | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildNodeSetsDefault = (nodeSets: NodeSetsFieldValue): Record<string, unknown> => {
  const result: Record<string, { hostType: string; size: number }> = {};
  for (const entry of nodeSets.entries) {
    const hostTypeId = entry.hostType.value.trim();
    const size = Number(entry.size);
    if (!hostTypeId || !Number.isFinite(size) || size <= 0) {
      continue;
    }
    result[hostTypeId] = { hostType: hostTypeId, size };
  }
  return result;
};

const buildNodeSetsValidation = (
  nodeSets: NodeSetsFieldValue,
): Record<string, unknown> | undefined => {
  const minimum = parseOptionalNumber(String(nodeSets.sizeMin ?? ''));
  const maximum = parseOptionalNumber(String(nodeSets.sizeMax ?? ''));
  if (minimum === undefined && maximum === undefined) {
    return undefined;
  }
  return {
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        size: {
          ...(minimum !== undefined ? { minimum } : {}),
          ...(maximum !== undefined ? { maximum } : {}),
        },
      },
    },
  };
};

const buildFieldDefinitions = (values: ClusterCatalogItemFormValues, t: TFunction) => [
  buildFieldDefinition('release_image', t('Release Image'), values.fieldDefinitions.release_image),
  buildFieldDefinition('network.pod_cidr', t('Pod CIDR'), values.fieldDefinitions.network.pod_cidr),
  buildFieldDefinition(
    'network.service_cidr',
    t('Service CIDR'),
    values.fieldDefinitions.network.service_cidr,
  ),
  buildFieldDefinition(
    'ssh_public_key',
    t('SSH Public Key'),
    values.fieldDefinitions.ssh_public_key,
  ),
  buildFieldDefinition('pull_secret', t('Pull Secret'), values.fieldDefinitions.pull_secret),
  buildFieldDefinition('node_sets', t('Node Sets'), {
    editable: values.fieldDefinitions.node_sets.editable,
    default: buildNodeSetsDefault(values.fieldDefinitions.node_sets),
    validation: buildNodeSetsValidation(values.fieldDefinitions.node_sets),
  }),
];

interface FooterProps {
  formik: FormikProps<ClusterCatalogItemFormValues>;
  setActiveStepId: (stepId: ClusterStepId) => void;
  setValidationAlert: (visible: boolean) => void;
  isPending: boolean;
}

const ClusterCatalogItemWizardFooter = ({
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

export const ClusterCatalogItemCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useSession();
  const { data: templates = [], isLoading: templatesLoading } = useAdminClusterTemplates();
  const { mutateAsync: createClusterCatalogItem, isPending } = useCreateClusterCatalogItem();
  const [activeStepId, setActiveStepId] = useState<ClusterStepId>('general');
  const [validationAlert, setValidationAlert] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const validationSchema = useMemo(
    () => getStepValidationSchema(activeStepId, t),
    [activeStepId, t],
  );

  const formik = useFormik<ClusterCatalogItemFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values) => {
      setSubmitError(undefined);
      try {
        await createClusterCatalogItem({
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
        } as Parameters<typeof createClusterCatalogItem>[0]);
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
            {t('Create cluster catalog item')}
          </Title>
          <Content component="p">
            {t('Define a curated cluster offering for tenants to provision from.')}
          </Content>
        </Stack>
      </PageSection>
      <FormikProvider value={formik}>
        <PageSection hasBodyWrapper={false} type={PageSectionTypes.wizard}>
          <Wizard
            navAriaLabel={t('Create cluster catalog item steps')}
            isVisitRequired
            footer={
              <WizardFooterWrapper>
                <ClusterCatalogItemWizardFooter
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
                    {stepId === 'configuration' ? <ClusterConfigurationStep /> : null}
                    {stepId === 'networking' ? <ClusterNetworkingStep /> : null}
                    {stepId === 'access' ? <ClusterAccessStep /> : null}
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

export default ClusterCatalogItemCreatePage;
