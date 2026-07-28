export const escapeCelStringLiteral = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

export const catalogItemProvisionedResourcesFilter = (catalogItemId: string): string =>
  `this.spec.catalog_item == "${escapeCelStringLiteral(catalogItemId)}"`;
