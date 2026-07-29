import type { ReactElement, ReactNode } from 'react';
import { Tooltip } from '@patternfly/react-core';

interface WithTooltipProps {
  showTooltip: boolean;
  content: ReactNode;
  children: ReactElement;
  /** Wrap children in a focusable/hoverable span before passing them to Tooltip — required when
   * the child itself won't fire hover/focus events while disabled (e.g. a disabled PatternFly
   * Switch), unlike `isAriaDisabled` buttons which remain hoverable on their own. */
  wrapWithSpan?: boolean;
}

const WithTooltip = ({ showTooltip, content, children, wrapWithSpan }: WithTooltipProps) => {
  if (!showTooltip) {
    return children;
  }

  return (
    <Tooltip content={content}>
      {wrapWithSpan ? <span tabIndex={0}>{children}</span> : children}
    </Tooltip>
  );
};

export default WithTooltip;
