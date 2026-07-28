import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

interface SanitizedMarkdownProps {
  children: string;
}

// No rehype-raw plugin is used, so react-markdown already drops embedded raw HTML as escaped
// text and restricts link/image URL protocols on its own. rehype-sanitize's schema is currently
// a defense-in-depth no-op on top of that — it becomes load-bearing (and must be reviewed) the
// moment rehype-raw or a plugin like remark-gfm that introduces id-based DOM clobbering is added.
// Links render as same-tab navigation (react-markdown's default, no target/rel added) — this is
// the current default, not a deliberate product decision; revisit if description links are ever
// meant to open externally, adding rel="noopener noreferrer" alongside any target="_blank".
const SanitizedMarkdown = ({ children }: SanitizedMarkdownProps) => (
  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
);

export default SanitizedMarkdown;
