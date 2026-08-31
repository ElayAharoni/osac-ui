import type { ComponentType } from 'react';
import type { FormikHelpers } from 'formik';
import type { AnyObjectSchema } from 'yup';

import type { CatalogItem } from '../../../catalog/catalogItemDisplay';
import type { CatalogProvisionKind } from '../../catalogFieldDefinition';
import type { WizardStepId } from '../stepIds';

export interface CatalogItemsQueryResult<TItem extends CatalogItem> {
  data: TItem[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
}

export interface GeneralFieldDescriptor {
  name: string;
  labelKey: string;
  /** Catalog `display_name` override; falls back to `t(labelKey)`. */
  label?: string;
  multiline?: boolean;
  isRequired?: boolean;
  isPassword?: boolean;
  isDisabled?: boolean;
  /** i18n key for InputField helperText (e.g. RFC 1035 DNS label description). */
  helperTextKey?: string;
}

/** A server rejection attributable to a specific field on a specific wizard step. */
export interface ProvisionFieldError {
  kind: 'field';
  stepId: WizardStepId;
  /** Formik dot-path, e.g. 'spec.bootDisk.storageTier' or 'spec.additionalDisks.0.storageTier'. */
  fieldName: string;
  message: string;
}

/** A server rejection that cannot be tied to a field — shown as a banner. */
export interface ProvisionBannerError {
  kind: 'banner';
  message: string;
}

export type ProvisionErrorResult = ProvisionFieldError | ProvisionBannerError;

export interface CatalogProvisionAdapter<TItem extends CatalogItem, TValues, TPayload> {
  kind: CatalogProvisionKind;
  useCatalogItems: () => CatalogItemsQueryResult<TItem>;
  getInitialValues: (catalogItem: TItem | null) => TValues;
  buildCreatePayload: (values: TValues, catalogItem: TItem) => TPayload;
  ConfigurationStep: ComponentType<{ catalogItem: TItem | null }>;
  /** Optional — only kinds whose ordered steps include 'storage' (compute instances) set this. */
  StorageStep?: ComponentType<{ catalogItem: TItem | null }>;
  NetworkingStep: ComponentType<{ catalogItem: TItem | null }>;
  GeneralStep: ComponentType<{ catalogItem: TItem | null }>;
  ReviewStep: ComponentType<{ catalogItem: TItem | null }>;
  getStepValidationSchema: (
    catalogItem: TItem | null,
    stepId: WizardStepId,
  ) => AnyObjectSchema | undefined;
  onCatalogItemSelected?: (item: TItem, helpers: FormikHelpers<TValues>) => void | Promise<void>;
  /**
   * Optional — only kinds with tier-bearing fields (compute instances) set this.
   * Must not throw; the wizard falls back to the generic banner if it does, but
   * implementations should map every reachable input to a result themselves.
   */
  mapProvisionError?: (error: unknown, values: TValues) => ProvisionErrorResult;
  wizardTitleKey: string;
  wizardDescriptionKey: string;
  breadcrumbCreateLabelKey: string;
  ariaLabelKey: string;
}
