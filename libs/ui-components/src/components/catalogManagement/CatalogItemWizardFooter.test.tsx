import { useState } from 'react';
import { Wizard, WizardStep } from '@patternfly/react-core';
import { screen } from '@testing-library/react';
import { FormikProvider, useField, useFormik } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import * as Yup from 'yup';

import { CatalogItemWizardFooter } from './CatalogItemWizardFooter';
import { renderWithProviders } from '../../test-utils/TestProviders';

interface Values {
  title: string;
  ssh: string;
}

const STEP_IDS = ['general', 'access'] as const;

const fullFormSchema = Yup.object({
  title: Yup.string().required('Name is required'),
  ssh: Yup.string().required('SSH is required'),
});

const stepSchema = (stepId: (typeof STEP_IDS)[number]) =>
  stepId === 'general'
    ? Yup.object({ title: Yup.string().required('Name is required') })
    : Yup.object({ ssh: Yup.string().required('SSH is required') });

const TextField = ({ name, label }: { name: string; label: string }) => {
  const [field] = useField<string>(name);
  return <input aria-label={label} {...field} value={field.value ?? ''} />;
};

const TestWizard = ({
  initialValues,
  onSubmit,
}: {
  initialValues: Values;
  onSubmit: () => void;
}) => {
  const [activeStepId, setActiveStepId] = useState<(typeof STEP_IDS)[number]>('general');
  const [validationAlert, setValidationAlert] = useState(false);
  const formik = useFormik<Values>({
    initialValues,
    validationSchema: stepSchema(activeStepId),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit,
  });

  return (
    <FormikProvider value={formik}>
      <Wizard
        isVisitRequired
        footer={
          <CatalogItemWizardFooter
            formik={formik}
            stepIds={STEP_IDS}
            onActiveStepIdChange={(id) => setActiveStepId(id as (typeof STEP_IDS)[number])}
            fullFormSchema={fullFormSchema}
            setValidationAlert={setValidationAlert}
            isPending={false}
          />
        }
      >
        <WizardStep id="general" name="General">
          {validationAlert ? <div>Validation error</div> : null}
          <TextField name="title" label="Title" />
        </WizardStep>
        <WizardStep id="access" name="Access">
          {validationAlert ? <div>Validation error</div> : null}
          <TextField name="ssh" label="SSH" />
        </WizardStep>
      </Wizard>
    </FormikProvider>
  );
};

describe('CatalogItemWizardFooter', () => {
  it('advances to the next step when the current step is valid', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <TestWizard initialValues={{ title: 'My item', ssh: '' }} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('blocks advancing when the current step is invalid', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <TestWizard initialValues={{ title: '', ssh: '' }} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Validation error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('blocks final submit when a previously-visited earlier step was cleared', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <TestWizard initialValues={{ title: 'My item', ssh: '' }} onSubmit={onSubmit} />,
    );

    // Visit Access (valid title lets Next through), then go back and clear the title.
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.clear(screen.getByRole('textbox', { name: 'Title' }));

    // Jump forward via the wizard nav (already-visited step; not gated by the footer's Next handler).
    await user.click(screen.getByRole('button', { name: 'Access' }));
    await user.type(screen.getByRole('textbox', { name: 'SSH' }), 'valid-key');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Validation error')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits when the full form is valid on the final step', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <TestWizard initialValues={{ title: 'My item', ssh: '' }} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByRole('textbox', { name: 'SSH' }), 'valid-key');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).toHaveBeenCalled();
  });
});
