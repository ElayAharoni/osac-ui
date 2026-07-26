const MAX_DNS_LABEL_LENGTH = 63;

/** Best-effort derivation of an RFC 1035 DNS label from free text, for fields that require both a display name and a resource name. */
export const slugify = (value: string): string => {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!base) {
    return 'item';
  }

  const prefixed = /^[a-z]/.test(base) ? base : `x-${base}`;
  return prefixed.slice(0, MAX_DNS_LABEL_LENGTH).replace(/-+$/, '');
};
