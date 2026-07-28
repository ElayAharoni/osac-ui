import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';
import type { ClusterCatalogItem as PrivateClusterCatalogItem } from '@osac/types/private';

import CatalogItemDetailActionButtons from './CatalogItemDetailActionButtons';
import { renderWithProviders } from '../../test-utils/TestProviders';

const publicItem = (overrides: Partial<ClusterCatalogItem> = {}): ClusterCatalogItem => ({
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-1',
  title: 'OpenShift 4 cluster',
  description: '',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [],
  ...overrides,
});

const privateItem = (
  overrides: Partial<PrivateClusterCatalogItem> = {},
): PrivateClusterCatalogItem => ({
  $typeName: 'osac.private.v1.ClusterCatalogItem',
  id: 'catalog-1',
  title: 'OpenShift 4 cluster',
  description: '',
  template: 'tpl-openshift-4',
  published: true,
  tenant: '',
  fieldDefinitions: [],
  ...overrides,
});

describe('CatalogItemDetailActionButtons', () => {
  it('renders all actions for providerAdmin on an organization-scoped item', () => {
    renderWithProviders(
      <CatalogItemDetailActionButtons
        catalogItem={privateItem({ tenant: 'acme-corp' })}
        role="providerAdmin"
        editHref="/admin/catalog/cluster/catalog-1/edit"
        onDeleteClick={vi.fn()}
        onTogglePublish={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders all actions for providerAdmin even on a general (global) item — CSP Admin is never hidden', () => {
    renderWithProviders(
      <CatalogItemDetailActionButtons
        catalogItem={privateItem({ tenant: '' })}
        role="providerAdmin"
        editHref="/admin/catalog/cluster/catalog-1/edit"
        onDeleteClick={vi.fn()}
        onTogglePublish={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders all actions for tenantAdmin on an organization-scoped item', () => {
    renderWithProviders(
      <CatalogItemDetailActionButtons
        catalogItem={publicItem({ metadata: { tenant: 'acme-corp' } as never })}
        role="tenantAdmin"
        editHref="/admin/catalog/cluster/catalog-1/edit"
        onDeleteClick={vi.fn()}
        onTogglePublish={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('renders all actions for tenantAdmin on a project-scoped item', () => {
    renderWithProviders(
      <CatalogItemDetailActionButtons
        catalogItem={publicItem({ metadata: { project: 'frontend' } as never })}
        role="tenantAdmin"
        editHref="/admin/catalog/cluster/catalog-1/edit"
        onDeleteClick={vi.fn()}
        onTogglePublish={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('hides all actions for tenantAdmin on a general (global) item', () => {
    const { container } = renderWithProviders(
      <CatalogItemDetailActionButtons
        catalogItem={publicItem()}
        role="tenantAdmin"
        editHref="/admin/catalog/cluster/catalog-1/edit"
        onDeleteClick={vi.fn()}
        onTogglePublish={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onDeleteClick when Delete is clicked', async () => {
    const onDeleteClick = vi.fn();
    const { user } = renderWithProviders(
      <CatalogItemDetailActionButtons
        catalogItem={privateItem()}
        role="providerAdmin"
        editHref="/admin/catalog/cluster/catalog-1/edit"
        onDeleteClick={onDeleteClick}
        onTogglePublish={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteClick).toHaveBeenCalled();
  });

  it('calls onTogglePublish when the switch is toggled', async () => {
    const onTogglePublish = vi.fn();
    const { user } = renderWithProviders(
      <CatalogItemDetailActionButtons
        catalogItem={privateItem({ published: true })}
        role="providerAdmin"
        editHref="/admin/catalog/cluster/catalog-1/edit"
        onDeleteClick={vi.fn()}
        onTogglePublish={onTogglePublish}
      />,
    );

    await user.click(screen.getByRole('switch'));
    expect(onTogglePublish).toHaveBeenCalledWith(false);
  });

  it('navigates to editHref when Edit is clicked', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route
          path="/admin/catalog/cluster/:id"
          element={
            <CatalogItemDetailActionButtons
              catalogItem={privateItem()}
              role="providerAdmin"
              editHref="/admin/catalog/cluster/catalog-1/edit"
              onDeleteClick={vi.fn()}
              onTogglePublish={vi.fn()}
            />
          }
        />
        <Route path="/admin/catalog/cluster/:id/edit" element={<div>edit-page</div>} />
      </Routes>,
      { routerEntries: ['/admin/catalog/cluster/catalog-1'] },
    );

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    await waitFor(() => {
      expect(screen.getByText('edit-page')).toBeInTheDocument();
    });
  });
});
