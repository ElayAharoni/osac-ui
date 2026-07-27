import { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex, useWizardContext } from '@patternfly/react-core';
import type { FormikProps } from 'formik';
import type { AnyObjectSchema } from 'yup';

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
  const isLast = stepIndex >= stepIds.length;

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
      // field cleared on a previously-visited earlier step can't slip through on final submit.
      void fullFormSchema.isValid(formik.values).then((isFullFormValid) => {
        if (!isFullFormValid) {
          setValidationAlert(true);
          return;
        }
        setValidationAlert(false);
        void formik.submitForm();
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
