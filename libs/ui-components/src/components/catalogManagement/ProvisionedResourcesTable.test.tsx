import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ProvisionedResourcesTable from './ProvisionedResourcesTable';
import { renderWithProviders } from '../../test-utils/TestProviders';

describe('ProvisionedResourcesTable', () => {
  it('renders rows linking to the resource detail page', () => {
    renderWithProviders(
      <ProvisionedResourcesTable
        rows={[
          {
            id: 'cluster-1',
            name: 'cluster-1',
            status: 'Ready',
            createdAt: undefined,
            href: '/clusters/cluster-1',
          },
        ]}
        total={1}
        isLoading={false}
        error={undefined}
        page={1}
        perPage={10}
        onSetPage={vi.fn()}
        onPerPageSelect={vi.fn()}
      />,
    );

    const link = screen.getByRole('link', { name: 'cluster-1' });
    expect(link).toHaveAttribute('href', '/clusters/cluster-1');
  });

  it('renders an empty state when there are no rows', () => {
    renderWithProviders(
      <ProvisionedResourcesTable
        rows={[]}
        total={0}
        isLoading={false}
        error={undefined}
        page={1}
        perPage={10}
        onSetPage={vi.fn()}
        onPerPageSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByText('No resources have been provisioned from this catalog item.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows a loading spinner while the query is in flight', () => {
    renderWithProviders(
      <ProvisionedResourcesTable
        rows={[]}
        total={0}
        isLoading
        error={undefined}
        page={1}
        perPage={10}
        onSetPage={vi.fn()}
        onPerPageSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not render pagination when there are no results', () => {
    renderWithProviders(
      <ProvisionedResourcesTable
        rows={[]}
        total={0}
        isLoading={false}
        error={undefined}
        page={1}
        perPage={10}
        onSetPage={vi.fn()}
        onPerPageSelect={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/pagination/i)).not.toBeInTheDocument();
  });

  it('renders pagination sized to the total item count', () => {
    renderWithProviders(
      <ProvisionedResourcesTable
        rows={[
          {
            id: 'cluster-1',
            name: 'cluster-1',
            status: 'Ready',
            createdAt: undefined,
            href: '/clusters/cluster-1',
          },
        ]}
        total={42}
        isLoading={false}
        error={undefined}
        page={1}
        perPage={10}
        onSetPage={vi.fn()}
        onPerPageSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('calls onSetPage when the pagination control advances', async () => {
    const onSetPage = vi.fn();
    const { user } = renderWithProviders(
      <ProvisionedResourcesTable
        rows={[
          {
            id: 'cluster-1',
            name: 'cluster-1',
            status: 'Ready',
            createdAt: undefined,
            href: '/clusters/cluster-1',
          },
        ]}
        total={42}
        isLoading={false}
        error={undefined}
        page={1}
        perPage={10}
        onSetPage={onSetPage}
        onPerPageSelect={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /go to next page/i }));
    expect(onSetPage).toHaveBeenCalled();
  });
});
