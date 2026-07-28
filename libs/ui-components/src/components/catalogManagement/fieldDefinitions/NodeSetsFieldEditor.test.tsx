import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import { NodeSetsFieldEditor, type NodeSetsTemplateLike } from './NodeSetsFieldEditor';
import * as hostTypesApi from '../../../api/v1/host-types';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('../../../api/v1/host-types', () => ({
  useHostTypes: vi.fn(),
  hostTypeDisplayName: (hostType: { id: string; title?: string }) => hostType.title ?? hostType.id,
}));

const mockHostTypes = (
  data: { id: string; title?: string }[] = [
    { id: 'small', title: 'Small' },
    { id: 'large', title: 'Large' },
  ],
) => {
  vi.mocked(hostTypesApi.useHostTypes).mockReturnValue({
    data,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof hostTypesApi.useHostTypes>);
};

interface Values {
  fieldDefinitions: {
    node_sets: {
      sizeByKey: Record<string, string>;
      editable: boolean;
      sizeMin?: string;
      sizeMax?: string;
    };
  };
}

const twoNodeSetTemplate: NodeSetsTemplateLike = {
  nodeSets: {
    workers: { hostType: 'small' },
    masters: { hostType: 'large' },
  },
};

const renderEditor = (initialValues: Values, template: NodeSetsTemplateLike | undefined) =>
  renderWithProviders(
    <Formik initialValues={initialValues} onSubmit={() => undefined}>
      {({ values }) => (
        <>
          <NodeSetsFieldEditor template={template} />
          <output aria-label="editable-value">
            {String(values.fieldDefinitions.node_sets.editable)}
          </output>
          <output aria-label="min-value">{values.fieldDefinitions.node_sets.sizeMin ?? ''}</output>
          <output aria-label="max-value">{values.fieldDefinitions.node_sets.sizeMax ?? ''}</output>
        </>
      )}
    </Formik>,
  );

describe('NodeSetsFieldEditor', () => {
  it('prompts for a template when none is selected', () => {
    mockHostTypes();
    renderEditor({ fieldDefinitions: { node_sets: { sizeByKey: {}, editable: true } } }, undefined);

    expect(screen.getByText('Select a template to configure node sets')).toBeInTheDocument();
  });

  it('shows a message when the selected template has no node sets', () => {
    mockHostTypes();
    renderEditor(
      { fieldDefinitions: { node_sets: { sizeByKey: {}, editable: true } } },
      { nodeSets: {} },
    );

    expect(screen.getByText('This template has no node sets defined')).toBeInTheDocument();
  });

  it('renders one row per template node set, with the host type read-only', () => {
    mockHostTypes();
    renderEditor(
      { fieldDefinitions: { node_sets: { sizeByKey: {}, editable: true } } },
      twoNodeSetTemplate,
    );

    expect(screen.getByText('Node set: workers')).toBeInTheDocument();
    expect(screen.getByText('Node set: masters')).toBeInTheDocument();
    expect(screen.getByText('Host type: Small')).toBeInTheDocument();
    expect(screen.getByText('Host type: Large')).toBeInTheDocument();
    // No free-form host type picker or add/remove controls — the template fully determines them.
    expect(screen.queryByRole('button', { name: 'Add node set' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Host type/)).not.toBeInTheDocument();
  });

  it('lets the admin set a default size per template node set', async () => {
    mockHostTypes();
    const { user } = renderEditor(
      { fieldDefinitions: { node_sets: { sizeByKey: {}, editable: true } } },
      twoNodeSetTemplate,
    );

    const sizeInputs = screen.getAllByLabelText(/^Nodes \(/);
    await user.type(sizeInputs[0], '3');

    expect(sizeInputs[0]).toHaveValue(3);
  });

  it('shows an error when host types fail to load, falling back to the raw id', () => {
    vi.mocked(hostTypesApi.useHostTypes).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('network down'),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hostTypesApi.useHostTypes>);
    renderEditor(
      { fieldDefinitions: { node_sets: { sizeByKey: {}, editable: true } } },
      twoNodeSetTemplate,
    );

    expect(screen.getByText('Could not load host types')).toBeInTheDocument();
    expect(screen.getByText('Host type: small')).toBeInTheDocument();
  });

  it('toggles the editable switch', async () => {
    mockHostTypes();
    const { user } = renderEditor(
      { fieldDefinitions: { node_sets: { sizeByKey: {}, editable: false } } },
      twoNodeSetTemplate,
    );

    await user.click(screen.getByRole('switch', { name: 'Editable' }));

    expect(screen.getByLabelText('editable-value')).toHaveTextContent('true');
  });

  it('updates size min/max constraints in Formik state', async () => {
    mockHostTypes();
    const { user } = renderEditor(
      { fieldDefinitions: { node_sets: { sizeByKey: {}, editable: true } } },
      twoNodeSetTemplate,
    );

    await user.type(screen.getByLabelText(/Minimum size/), '1');
    await user.type(screen.getByLabelText(/Maximum size/), '10');

    expect(screen.getByLabelText('min-value')).toHaveTextContent('1');
    expect(screen.getByLabelText('max-value')).toHaveTextContent('10');
  });
});
