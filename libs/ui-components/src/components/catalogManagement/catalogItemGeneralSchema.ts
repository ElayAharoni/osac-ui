import type { TFunction } from 'i18next';
import * as Yup from 'yup';

export const templateRequiredSchema = (t: TFunction) =>
  Yup.object({ value: Yup.string().required() }).test(
    'template-selected',
    t('Template is required'),
    (template) => Boolean(template?.value?.trim()),
  );
