import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import { plainToProtobufValue } from '../../catalogProvision/protobuf-value';

/** Formik-facing shape for one field definition being authored in the admin catalog item wizard. */
export interface FieldDefinitionValue<TDefault = string> {
  editable: boolean;
  default: TDefault;
  /** JSON-Schema-subset constraints, e.g. `{ pattern }` or `{ minimum, maximum }`. Omitted = no validation. */
  validation?: Record<string, unknown>;
}

/** Wire shape shared by `osac.public.v1.FieldDefinition` and `osac.private.v1.FieldDefinition` (structurally identical). */
export interface FieldDefinitionInit {
  path: string;
  displayName: string;
  editable: boolean;
  default: unknown;
  validationSchema: string;
}

export const buildFieldDefinition = <TDefault>(
  path: string,
  displayName: string,
  value: FieldDefinitionValue<TDefault>,
): FieldDefinitionInit => ({
  path,
  displayName,
  editable: value.editable,
  default: plainToProtobufValue(value.default),
  validationSchema: value.validation ? JSON.stringify(value.validation) : '',
});

/** Shared validation for a field definition value: a default is required when the field is non-editable. */
export const fieldDefinitionValueSchema = (t: TFunction) =>
  Yup.object({
    editable: Yup.boolean().required(),
    default: Yup.mixed().when('editable', {
      is: false,
      then: (schema) =>
        schema.test(
          'required-default',
          t('Default value is required for non-editable fields'),
          (value) => value !== undefined && value !== null && value !== '',
        ),
    }),
  });
