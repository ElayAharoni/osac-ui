const MAX_DNS_LABEL_LENGTH = 63;
const SUFFIX_LENGTH = 6;

/** Best-effort derivation of an RFC 1035 DNS label from free text, for fields that require both a display name and a resource name. */
export const slugify = (value: string): string => {
  const base = value
    .trim()
    .toLowerCase()
    // Diacritics (e.g. "Café" -> "cafe") decompose into a base letter plus a combining mark under
    // NFKD; stripping the marks keeps the base letter instead of dropping it as an invalid character.
    // Non-Latin scripts (Cyrillic, CJK, ...) have no such decomposition and still fall through to
    // the 'item' fallback below.
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!base) {
    return 'item';
  }

  const prefixed = /^[a-z]/.test(base) ? base : `x-${base}`;
  return prefixed.slice(0, MAX_DNS_LABEL_LENGTH).replace(/-+$/, '');
};

/** `slugify()` plus a short random suffix, so identical or near-identical titles don't collide on the same resource name. */
export const slugifyUnique = (value: string): string => {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, SUFFIX_LENGTH);
  const base = slugify(value)
    .slice(0, MAX_DNS_LABEL_LENGTH - SUFFIX_LENGTH - 1)
    .replace(/-+$/, '');
  return `${base}-${suffix}`;
};
