import { checkOtelConfigAndWarn } from './otel';
import { _runTest } from './test-single-internal';

/**
 * Runs a single named test case within the context of an active experiment.
 * Creates an OpenTelemetry span capturing the test execution details, result, and status.
 * Must be called within the callback of `experiment()`.
 *
 * @template TResult The expected return type of the test callback function
 * @param {string} spanName A descriptive name for the test case, used for tracing and reporting
 * @param {() => TResult | null | Promise<TResult | null>} callback The function containing the test logic
 * @returns {Promise<TResult | null>} A promise that resolves with the result of the callback function or null if an error occurs
 * @throws {Error} If called outside of an experiment context
 *
 * @example
 * experiment('pipeline-uuid', () => {
 *   test('simple-addition-test', () => {
 *     return 1 + 1;
 *   });
 * });
 */
export async function test<TResult>(
  spanName: string,
  callback: () => TResult | null | Promise<TResult | null>,
): Promise<TResult | null> {
  checkOtelConfigAndWarn();

  return _runTest<TResult, any>({
    spanName,
    spanAttributes: { 'gentrace.test_case_name': spanName },
    callback,
  });
}

// Re-export the _runTest function
export { _runTest };
