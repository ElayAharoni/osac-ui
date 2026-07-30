import { screen, within } from '@testing-library/react';
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

interface NodeSetEntryValue {
  default?: string;
  min?: string;
  max?: string;
}

interface Values {
  fieldDefinitions: {
    node_sets: {
      entriesByKey: Record<string, NodeSetEntryValue>;
      editable: boolean;
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
          <output aria-label="workers-min-value">
            {values.fieldDefinitions.node_sets.entriesByKey.workers?.min ?? ''}
          </output>
          <output aria-label="workers-max-value">
            {values.fieldDefinitions.node_sets.entriesByKey.workers?.max ?? ''}
          </output>
        </>
      )}
    </Formik>,
  );

describe('NodeSetsFieldEditor', () => {
  it('prompts for a template when none is selected', () => {
    mockHostTypes();
    renderEditor(
      { fieldDefinitions: { node_sets: { entriesByKey: {}, editable: true } } },
      undefined,
    );

    expect(screen.getByText('Select a template to configure node sets')).toBeInTheDocument();
  });

  it('shows a message when the selected template has no node sets', () => {
    mockHostTypes();
    renderEditor(
      { fieldDefinitions: { node_sets: { entriesByKey: {}, editable: true } } },
      { nodeSets: {} },
    );

    expect(screen.getByText('This template has no node sets defined')).toBeInTheDocument();
  });

  it('renders one row per template node set, headed by its host type', () => {
    mockHostTypes();
    renderEditor(
      { fieldDefinitions: { node_sets: { entriesByKey: {}, editable: true } } },
      twoNodeSetTemplate,
    );

    // A node set always maps to exactly one host type, so the host type alone is shown as the
    // group's header — no separate key label or badge duplicating the same information.
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
    // No free-form host type picker or add/remove controls — the template fully determines them.
    expect(screen.queryByRole('button', { name: 'Add node set' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Host type/)).not.toBeInTheDocument();
  });

  it('lets the admin set an independent default/min/max per template node set', async () => {
    mockHostTypes();
    const { user } = renderEditor(
      { fieldDefinitions: { node_sets: { entriesByKey: {}, editable: true } } },
      twoNodeSetTemplate,
    );

    const workersGroup = within(screen.getByRole('group', { name: 'Small' }));
    await user.type(workersGroup.getByLabelText('Default nodes'), '3');
    await user.type(workersGroup.getByLabelText('Minimum nodes'), '1');
    await user.type(workersGroup.getByLabelText('Maximum nodes'), '5');

    expect(workersGroup.getByLabelText('Default nodes')).toHaveValue(3);
    expect(screen.getByLabelText('workers-min-value')).toHaveTextContent('1');
    expect(screen.getByLabelText('workers-max-value')).toHaveTextContent('5');
  });

  it('shows an error when host types fail to load, falling back to the raw id', () => {
    vi.mocked(hostTypesApi.useHostTypes).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('network down'),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hostTypesApi.useHostTypes>);
    renderEditor(
      { fieldDefinitions: { node_sets: { entriesByKey: {}, editable: true } } },
      twoNodeSetTemplate,
    );

    expect(screen.getByText('Could not load host types')).toBeInTheDocument();
    expect(screen.getByText('small')).toBeInTheDocument();
  });

  it('toggles the editable switch', async () => {
    mockHostTypes();
    const { user } = renderEditor(
      { fieldDefinitions: { node_sets: { entriesByKey: {}, editable: false } } },
      twoNodeSetTemplate,
    );

    await user.click(screen.getByRole('switch', { name: 'Editable' }));

    expect(screen.getByLabelText('editable-value')).toHaveTextContent('true');
  });
});
