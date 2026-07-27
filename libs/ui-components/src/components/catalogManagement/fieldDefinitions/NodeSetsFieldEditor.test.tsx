import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import { NodeSetsFieldEditor } from './NodeSetsFieldEditor';
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

interface NodeSetEntry {
  rowId: string;
  hostType: { value: string; label: string };
  size: string;
}

interface Values {
  fieldDefinitions: {
    node_sets: {
      entries: NodeSetEntry[];
      editable: boolean;
      allowAddRemove: boolean;
      sizeMin?: string;
      sizeMax?: string;
    };
  };
}

const emptyEntry = (rowId: string): NodeSetEntry => ({
  rowId,
  hostType: { value: '', label: '' },
  size: '',
});

const renderEditor = (initialValues: Values) =>
  renderWithProviders(
    <Formik initialValues={initialValues} onSubmit={() => undefined}>
      {({ values }) => (
        <>
          <NodeSetsFieldEditor />
          <output aria-label="entry-count">
            {values.fieldDefinitions.node_sets.entries.length}
          </output>
          <output aria-label="editable-value">
            {String(values.fieldDefinitions.node_sets.editable)}
          </output>
          <output aria-label="allow-add-remove-value">
            {String(values.fieldDefinitions.node_sets.allowAddRemove)}
          </output>
          <output aria-label="min-value">{values.fieldDefinitions.node_sets.sizeMin ?? ''}</output>
          <output aria-label="max-value">{values.fieldDefinitions.node_sets.sizeMax ?? ''}</output>
        </>
      )}
    </Formik>,
  );

describe('NodeSetsFieldEditor', () => {
  it('renders one row per existing entry', () => {
    mockHostTypes();
    renderEditor({
      fieldDefinitions: {
        node_sets: {
          entries: [emptyEntry('row-1'), emptyEntry('row-2')],
          editable: true,
          allowAddRemove: true,
        },
      },
    });

    expect(screen.getByText('Node set 1')).toBeInTheDocument();
    expect(screen.getByText('Node set 2')).toBeInTheDocument();
  });

  it('adds a new row', async () => {
    mockHostTypes();
    const { user } = renderEditor({
      fieldDefinitions: {
        node_sets: { entries: [emptyEntry('row-1')], editable: true, allowAddRemove: true },
      },
    });

    await user.click(screen.getByRole('button', { name: 'Add node set' }));

    expect(screen.getByLabelText('entry-count')).toHaveTextContent('2');
  });

  it('removes a row', async () => {
    mockHostTypes();
    const { user } = renderEditor({
      fieldDefinitions: {
        node_sets: {
          entries: [emptyEntry('row-1'), emptyEntry('row-2')],
          editable: true,
          allowAddRemove: true,
        },
      },
    });

    await user.click(screen.getByRole('button', { name: 'Remove node set 2' }));

    expect(screen.getByLabelText('entry-count')).toHaveTextContent('1');
  });

  it('does not show a remove button for the first row when it is the only row', () => {
    mockHostTypes();
    renderEditor({
      fieldDefinitions: {
        node_sets: { entries: [emptyEntry('row-1')], editable: true, allowAddRemove: true },
      },
    });

    expect(screen.queryByRole('button', { name: /^Remove node set/ })).not.toBeInTheDocument();
  });

  it('gives each remove button in a multi-row list a distinct accessible name', () => {
    mockHostTypes();
    renderEditor({
      fieldDefinitions: {
        node_sets: {
          entries: [emptyEntry('row-1'), emptyEntry('row-2'), emptyEntry('row-3')],
          editable: true,
          allowAddRemove: true,
        },
      },
    });

    expect(screen.getByRole('button', { name: 'Remove node set 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove node set 3' })).toBeInTheDocument();
  });

  it('shows an error and disables adding rows when host types fail to load', () => {
    vi.mocked(hostTypesApi.useHostTypes).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('network down'),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hostTypesApi.useHostTypes>);
    renderEditor({
      fieldDefinitions: {
        node_sets: { entries: [emptyEntry('row-1')], editable: true, allowAddRemove: true },
      },
    });

    expect(screen.getByText('Could not load host types')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add node set' })).toBeDisabled();
  });

  it('disables an already-selected host type in other rows', async () => {
    mockHostTypes();
    const { user } = renderEditor({
      fieldDefinitions: {
        node_sets: {
          entries: [
            { rowId: 'row-1', hostType: { value: 'small', label: 'Small' }, size: '1' },
            emptyEntry('row-2'),
          ],
          editable: true,
          allowAddRemove: true,
        },
      },
    });

    const hostTypeSelects = screen.getAllByLabelText(/^Host type/);
    await user.click(hostTypeSelects[1]);

    expect(screen.getByRole('option', { name: 'Small' })).toBeDisabled();
  });

  it('toggles the editable and allow-add-remove switches', async () => {
    mockHostTypes();
    const { user } = renderEditor({
      fieldDefinitions: {
        node_sets: { entries: [emptyEntry('row-1')], editable: false, allowAddRemove: false },
      },
    });

    await user.click(screen.getByRole('switch', { name: 'Editable' }));
    await user.click(screen.getByRole('switch', { name: 'Allow add/remove' }));

    expect(screen.getByLabelText('editable-value')).toHaveTextContent('true');
    expect(screen.getByLabelText('allow-add-remove-value')).toHaveTextContent('true');
  });

  it('updates size min/max constraints in Formik state', async () => {
    mockHostTypes();
    const { user } = renderEditor({
      fieldDefinitions: {
        node_sets: { entries: [emptyEntry('row-1')], editable: true, allowAddRemove: true },
      },
    });

    await user.type(screen.getByLabelText(/Minimum size/), '1');
    await user.type(screen.getByLabelText(/Maximum size/), '10');

    expect(screen.getByLabelText('min-value')).toHaveTextContent('1');
    expect(screen.getByLabelText('max-value')).toHaveTextContent('10');
  });
});
