import type { TFunction } from 'i18next';
import * as Yup from 'yup';

/** Requires a LabeledResourceRef (`{value, label}`) to have a non-empty `value`. */
export const resourceRefRequiredSchema = (message: string) =>
  Yup.object({ value: Yup.string().required() }).test('resource-ref-selected', message, (ref) =>
    Boolean(ref?.value?.trim()),
  );

export const templateRequiredSchema = (t: TFunction) =>
  resourceRefRequiredSchema(t('Template is required'));
