import { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex, useWizardContext } from '@patternfly/react-core';
import { type FormikProps, yupToFormErrors } from 'formik';
import type { AnyObjectSchema, ValidationError } from 'yup';

import { useTranslation } from '../../hooks/useTranslation';

interface CatalogItemWizardFooterProps<TValues extends object> {
  formik: FormikProps<TValues>;
  stepIds: readonly string[];
  onActiveStepIdChange: (stepId: string) => void;
  /** Validated in full (not just the active step's subset) before the final submit is allowed through. */
  fullFormSchema: AnyObjectSchema;
  setValidationAlert: (visible: boolean) => void;
  isPending: boolean;
}

export const CatalogItemWizardFooter = <TValues extends object>({
  formik,
  stepIds,
  onActiveStepIdChange,
  fullFormSchema,
  setValidationAlert,
  isPending,
}: CatalogItemWizardFooterProps<TValues>) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeStep, goToStepByIndex } = useWizardContext();
  const activeStepId =
    typeof activeStep?.id === 'string' && stepIds.includes(activeStep.id)
      ? activeStep.id
      : stepIds[0];

  useLayoutEffect(() => {
    onActiveStepIdChange(activeStepId);
  }, [activeStepId, onActiveStepIdChange]);

  const stepIndex = activeStep?.index ?? 1;
  const isFirst = stepIndex <= 1;
  // Derived from stepIds, not activeStep.index: the PatternFly step index counts every WizardStep
  // in the tree, so it would silently drift from stepIds.length if a non-stepIds step (e.g. a
  // future review step) were ever added.
  const isLast = stepIds.indexOf(activeStepId) >= stepIds.length - 1;

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
      if (!isLast) {
        setValidationAlert(false);
        goToStepByIndex(stepIndex + 1);
        return;
      }
      // The active step's own schema only covers its own fields — validate the full form here so a
      // field cleared on a previously-visited earlier step can't slip through on final submit. Use
      // validate() rather than isValid() so a failure on an earlier step populates Formik's field
      // errors instead of leaving the admin stuck on Create with no indication of what to fix.
      void fullFormSchema
        .validate(formik.values, { abortEarly: false })
        .then(() => {
          setValidationAlert(false);
          void formik.submitForm();
        })
        .catch((err: ValidationError) => {
          formik.setErrors(yupToFormErrors(err));
          setValidationAlert(true);
        });
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
