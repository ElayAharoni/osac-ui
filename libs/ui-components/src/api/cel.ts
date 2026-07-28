export const escapeCelStringLiteral = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
