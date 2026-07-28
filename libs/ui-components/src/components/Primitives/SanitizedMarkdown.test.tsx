import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SanitizedMarkdown from './SanitizedMarkdown';

describe('SanitizedMarkdown', () => {
  it('renders basic Markdown formatting', () => {
    render(<SanitizedMarkdown>{'**bold** and [a link](https://example.com)'}</SanitizedMarkdown>);

    expect(screen.getByText('bold').tagName).toBe('STRONG');
    const link = screen.getByRole('link', { name: 'a link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('does not render a script element for embedded script tags', () => {
    const { container } = render(
      <SanitizedMarkdown>{'before <script>alert("xss")</script> after'}</SanitizedMarkdown>,
    );

    expect(container.querySelector('script')).toBeNull();
  });

  it('strips javascript: URLs from links', () => {
    const { container } = render(
      <SanitizedMarkdown>{'[click me](javascript:alert(1))'}</SanitizedMarkdown>,
    );

    expect(container.innerHTML.toLowerCase()).not.toContain('javascript:');
  });

  it('strips javascript: URLs from images', () => {
    const { container } = render(
      <SanitizedMarkdown>{'![alt text](javascript:alert(1))'}</SanitizedMarkdown>,
    );

    expect(container.innerHTML.toLowerCase()).not.toContain('javascript:');
  });

  it('does not throw on malformed Markdown', () => {
    expect(() =>
      render(<SanitizedMarkdown>{'[unterminated link(('}</SanitizedMarkdown>),
    ).not.toThrow();
  });

  it('renders nothing for empty content', () => {
    const { container } = render(<SanitizedMarkdown>{''}</SanitizedMarkdown>);
    expect(container.textContent).toBe('');
  });
});
