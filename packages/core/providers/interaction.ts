import { GentraceDeprecationWarning } from "./warnings";

/**
 * @deprecated This package is deprecated. Please use 'npm install gentrace' instead.
 *
 * This function will display a deprecation warning and throw an error to stop execution.
 *
 * @param name - The name of the interaction
 * @param fn - The function to wrap (not executed due to deprecation)
 * @param options - Options for the interaction (not used due to deprecation)
 * @throws {Error} Always throws an error after displaying the deprecation warning
 */
export function interaction<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  options?: {
    pipelineId?: string;
    attributes?: Record<string, any>;
    suppressWarnings?: boolean;
  },
): T {
  // Display the deprecation warning
  const warning = GentraceDeprecationWarning();
  warning.display();

  // Throw an error to immediately stop execution
  throw new Error(
    "Package @gentrace/core is deprecated. Please install and use the new package: npm install gentrace",
  );
}
