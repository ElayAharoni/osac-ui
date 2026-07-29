import { Button } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import WithTooltip from './WithTooltip';

describe('WithTooltip', () => {
  it('renders children unwrapped when showTooltip is false', () => {
    render(
      <WithTooltip showTooltip={false} content="Not shown">
        <Button>Click me</Button>
      </WithTooltip>,
    );

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    expect(screen.queryByText('Not shown')).not.toBeInTheDocument();
  });

  it('shows the tooltip content on hover when showTooltip is true', async () => {
    const user = userEvent.setup();
    render(
      <WithTooltip showTooltip content="Disabled reason">
        <Button isAriaDisabled>Click me</Button>
      </WithTooltip>,
    );

    await user.hover(screen.getByRole('button', { name: 'Click me' }));
    expect(await screen.findAllByText('Disabled reason')).not.toHaveLength(0);
  });

  it('wraps children in a focusable span when wrapWithSpan is set', async () => {
    const user = userEvent.setup();
    render(
      <WithTooltip showTooltip content="Disabled reason" wrapWithSpan>
        <Button isAriaDisabled>Click me</Button>
      </WithTooltip>,
    );

    const wrapperSpan = screen.getByRole('button', { name: 'Click me' }).closest('span');
    expect(wrapperSpan).toHaveAttribute('tabindex', '0');

    await user.hover(wrapperSpan as HTMLElement);
    expect(await screen.findAllByText('Disabled reason')).not.toHaveLength(0);
  });
});
