import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CatalogItemPublishToggle from './CatalogItemPublishToggle';
import { renderWithProviders } from '../../test-utils/TestProviders';

describe('CatalogItemPublishToggle', () => {
  it('shows the published label and a checked switch when published', () => {
    renderWithProviders(<CatalogItemPublishToggle published onChange={vi.fn()} />);
    expect(screen.getByRole('switch', { name: 'Published' })).toBeChecked();
  });

  it('shows the unpublished label and an unchecked switch when not published', () => {
    renderWithProviders(<CatalogItemPublishToggle published={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch', { name: 'Unpublished' })).not.toBeChecked();
  });

  it('calls onChange with the inverted value on click', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <CatalogItemPublishToggle published={false} onChange={onChange} />,
    );

    await user.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('respects isDisabled', () => {
    renderWithProviders(<CatalogItemPublishToggle published isDisabled onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
