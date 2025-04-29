// Convert a string to snake_case
export function toSnakeCase(str: string): string {
  if (!str) return '';

  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/[-\s_]+/g, '_')
    .toLowerCase();
}
