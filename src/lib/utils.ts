// Convert a string to snake_case
export function toSnakeCase(str: string): string {
  if (!str) return '';

  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/[-\s_]+/g, '_')
    .toLowerCase();
}

declare const TypeException: unique symbol;

/**
 * This is a unique symbol that is used to create a type error when the wrong type is used.
 */
export type ErrorType<Msg extends string> = { [TypeException]: Msg };
