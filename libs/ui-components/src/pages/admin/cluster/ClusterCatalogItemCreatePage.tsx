import { useEffect, useMemo, useState } from 'react';
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

import { ClusterCatalogItemSchema } from '@osac/types';

import { useCreateClusterCatalogItem } from '../../../api/v1/cluster-catalog-item';
import { useAdminClusterTemplates } from '../../../api/v1/cluster-templates';
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
import type {
  NodeSetsFieldValue,
  NodeSetsTemplateLike,
} from '../../../components/catalogManagement/fieldDefinitions/NodeSetsFieldEditor';
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
import { IPV4_CIDR_PATTERN, isValidCidr } from '../../../validation/cidr-validation';

const STEP_IDS = ['general', 'configuration', 'networking', 'access'] as const;
type ClusterStepId = (typeof STEP_IDS)[number];

const STEP_LABEL_KEYS: Record<ClusterStepId, string> = {
  general: 'General',
  configuration: 'Configuration',
  networking: 'Networking',
  access: 'Access',
};

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

const SSH_PUBLIC_KEY_PATTERN =
  '^(ssh-rsa|ecdsa-sha2-nistp(256|384|521)|ssh-ed25519) AAAA[0-9A-Za-z+/]+[=]{0,3}( .*)?$';

const createInitialValues = (
  role: ReturnType<typeof useSession>['role'],
): ClusterCatalogItemFormValues => ({
  title: '',
  description: '',
  template: EMPTY_LABELED_RESOURCE_REF,
  scope: initialScopeForRole(role),
  fieldDefinitions: {
    release_image: { editable: true, default: '' },
    node_sets: {
      sizeByKey: {},
      editable: true,
    },
    network: {
      pod_cidr: { editable: true, default: '', validation: { pattern: IPV4_CIDR_PATTERN } },
      service_cidr: { editable: true, default: '', validation: { pattern: IPV4_CIDR_PATTERN } },
    },
    ssh_public_key: {
      editable: true,
      default: '',
      validation: { pattern: SSH_PUBLIC_KEY_PATTERN },
    },
    pull_secret: { editable: true, default: '' },
  },
});

const cidrFormatTest = (t: TFunction) => ({
  name: 'valid-cidr',
  message: t('Must be a valid IPv4 CIDR notation (for example 10.128.0.0/14)'),
  test: (value: unknown) => typeof value === 'string' && isValidCidr(value, 'ipv4'),
});

// Node sets are entirely determined by the selected cluster template — fulfillment-service rejects
// any node set whose key or host type doesn't match the template (see
// `PrivateClustersServer.validateNodeSets`). An admin can only provide a default `size` per
// template-defined node set, so the schema is built dynamically, one positive-size check per
// current template node-set key, rather than a fixed shape.
const nodeSetsSchema = (t: TFunction, templateNodeSetKeys: string[]) =>
  Yup.object({
    sizeByKey: Yup.object(
      Object.fromEntries(
        templateNodeSetKeys.map((key) => [
          key,
          Yup.string().test(
            'positive-size',
            t('Size must be a positive number'),
            (value) => Number.isFinite(Number(value)) && Number(value) > 0,
          ),
        ]),
      ),
    ),
  });

const getStepValidationSchema = (
  stepId: ClusterStepId,
  t: TFunction,
  templateNodeSetKeys: string[],
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
          release_image: fieldDefinitionValueSchema(t),
          node_sets: nodeSetsSchema(t, templateNodeSetKeys),
        }),
      });
    case 'networking':
      return Yup.object({
        fieldDefinitions: Yup.object({
          network: Yup.object({
            pod_cidr: fieldDefinitionValueSchema(t, cidrFormatTest(t)),
            service_cidr: fieldDefinitionValueSchema(t, cidrFormatTest(t)),
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

// Validated once, in full, before the final submit — the active step's own schema (above) only
// covers its own fields, which would let a field cleared on an earlier, already-visited step
// through undetected (see CatalogItemWizardFooter).
const getFullFormValidationSchema = (
  t: TFunction,
  templateNodeSetKeys: string[],
  role: ReturnType<typeof useSession>['role'],
) =>
  Yup.object({
    title: Yup.string().required(t('Name is required')),
    template: templateRequiredSchema(t),
    scope: scopeValidationSchema(t, role),
    fieldDefinitions: Yup.object({
      release_image: fieldDefinitionValueSchema(t),
      node_sets: nodeSetsSchema(t, templateNodeSetKeys),
      network: Yup.object({
        pod_cidr: fieldDefinitionValueSchema(t, cidrFormatTest(t)),
        service_cidr: fieldDefinitionValueSchema(t, cidrFormatTest(t)),
      }),
      ssh_public_key: fieldDefinitionValueSchema(t),
      pull_secret: fieldDefinitionValueSchema(t),
    }),
  });

const parseOptionalNumber = (value: string | undefined): number | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

// Node sets are keyed and host-typed by the template (see nodeSetsSchema above) — only the size
// the admin entered for each template key is ever taken from the form.
const buildNodeSetsDefault = (
  nodeSets: NodeSetsFieldValue,
  template: NodeSetsTemplateLike | undefined,
): Record<string, unknown> => {
  const result: Record<string, { hostType: string; size: number }> = {};
  for (const [key, templateNodeSet] of Object.entries(template?.nodeSets ?? {})) {
    const size = Number(nodeSets.sizeByKey[key]);
    if (!Number.isFinite(size) || size <= 0) {
      continue;
    }
    result[key] = { hostType: templateNodeSet.hostType, size };
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

const buildFieldDefinitions = (
  values: ClusterCatalogItemFormValues,
  t: TFunction,
  template: NodeSetsTemplateLike | undefined,
) => [
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
    default: buildNodeSetsDefault(values.fieldDefinitions.node_sets, template),
    validation: buildNodeSetsValidation(values.fieldDefinitions.node_sets),
  }),
];

export const ClusterCatalogItemCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useSession();
  const { data: templates = [], isLoading: templatesLoading } = useAdminClusterTemplates();
  const { mutateAsync: createClusterCatalogItem, isPending } = useCreateClusterCatalogItem();
  const [activeStepId, setActiveStepId] = useState<ClusterStepId>('general');
  const [validationAlert, setValidationAlert] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  // Mirrors formik.values.template.value so the node-set validation schema (below) can react to the
  // template the admin picks — read directly from Formik state once `formik` exists (see effect).
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [templates, selectedTemplateId],
  );
  const templateNodeSetKeys = useMemo(
    () => Object.keys(selectedTemplate?.nodeSets ?? {}).sort(),
    [selectedTemplate],
  );

  const initialValues = useMemo(() => createInitialValues(role), [role]);
  const validationSchema = useMemo(
    () => getStepValidationSchema(activeStepId, t, templateNodeSetKeys, role),
    [activeStepId, t, templateNodeSetKeys, role],
  );
  const fullFormSchema = useMemo(
    () => getFullFormValidationSchema(t, templateNodeSetKeys, role),
    [t, templateNodeSetKeys, role],
  );

  const formik = useFormik<ClusterCatalogItemFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values) => {
      setSubmitError(undefined);
      try {
        const template = templates.find((candidate) => candidate.id === values.template.value);
        const payload: MessageInitShape<typeof ClusterCatalogItemSchema> = {
          title: values.title.trim(),
          description: values.description.trim(),
          template: values.template.value,
          published: false,
          ...buildScopePayloadFields(values.scope, role, values.title),
          // buildFieldDefinition()'s `default` is a decoded google.protobuf.Value init shape;
          // MessageInitShape can't structurally verify it against the generated Value type, so
          // this one property needs a cast (see buildFieldDefinition in fieldDefinitionValue.ts).
          fieldDefinitions: buildFieldDefinitions(values, t, template) as MessageInitShape<
            typeof ClusterCatalogItemSchema
          >['fieldDefinitions'],
        };
        await createClusterCatalogItem(payload);
        navigate('/admin/catalog');
      } catch (error) {
        setSubmitError(getErrorMessage(error));
      }
    },
  });

  useEffect(() => {
    setSelectedTemplateId(formik.values.template.value);
  }, [formik.values.template.value]);

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
                <CatalogItemWizardFooter
                  formik={formik}
                  stepIds={STEP_IDS}
                  onActiveStepIdChange={(id) => setActiveStepId(id as ClusterStepId)}
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
                    {stepId === 'configuration' ? (
                      <ClusterConfigurationStep templates={templates} />
                    ) : null}
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
