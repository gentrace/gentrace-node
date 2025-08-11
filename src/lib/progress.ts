import * as cliProgress from 'cli-progress';
import type { Logger } from '../client';

/**
 * Helper function to fit a name into a fixed number of spaces.
 * If the name is shorter than the length, it pads with spaces.
 * If the name is longer, it truncates with ellipsis.
 *
 * @internal
 * @param name - The name to fit
 * @param length - The target length (default: 40)
 * @returns The fitted name string
 */
function fitNameToSpaces(name: string, length: number = 40): string {
  if (name.length <= length) {
    return name.padEnd(length);
  }
  return name.substring(0, length - 3) + '...';
}

/**
 * Interface for progress reporting during evaluation runs.
 * Implementations can provide different visualization strategies
 * for tracking the progress of test case execution.
 *
 * @example
 * ```typescript
 * const reporter: ProgressReporter = showProgressBar
 *   ? new BarProgressReporter()
 *   : new SimpleProgressReporter();
 *
 * reporter.start('my-pipeline', 100);
 * for (const testCase of testCases) {
 *   await runTest(testCase);
 *   reporter.increment(testCase.name);
 * }
 * reporter.stop();
 * ```
 */
export interface ProgressReporter {
  /**
   * Initialize the progress reporter for a new evaluation run.
   *
   * @param name - The name or identifier of the evaluation (e.g., pipeline ID)
   * @param total - The total number of test cases to be executed
   */
  start(name: string, total: number): void;

  /**
   * Update the current test case being processed (for display purposes).
   *
   * @param testCaseName - The name of the test case currently being processed
   */
  updateCurrentTest?(testCaseName: string): void;

  /**
   * Report that a single test case has been completed.
   *
   * @param testCaseName - The name or identifier of the completed test case
   */
  increment(testCaseName: string): void;

  /**
   * Finalize the progress reporter after all test cases have been executed.
   * This should be called whether the evaluation completed successfully or not.
   */
  stop(): void;
}

/**
 * Simple progress reporter that outputs line-by-line progress to the console.
 * Ideal for CI/CD environments where interactive terminals are not available
 * or when you want persistent, searchable logs of each test case execution.
 *
 * @example Output format:
 * ```
 * Running evaluation "pipeline-123" with 50 test cases...
 * [1/50] Running test case: "Login test"
 * [2/50] Running test case: "Signup test"
 * ...
 * [50/50] Running test case: "Logout test"
 * Evaluation complete.
 * ```
 *
 * @example Usage:
 * ```typescript
 * const reporter = new SimpleProgressReporter(logger);
 * reporter.start('my-pipeline', 10);
 * reporter.increment('Test 1');
 * reporter.increment('Test 2');
 * reporter.stop();
 * ```
 */
export class SimpleProgressReporter implements ProgressReporter {
  private total = 0;
  private count = 0;
  private logger: Logger | undefined;

  /**
   * Creates a new SimpleProgressReporter instance.
   *
   * @param logger - Optional logger instance. If not provided, falls back to console.
   */
  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Initialize a new evaluation run with line-by-line output.
   *
   * @param name - The name or identifier of the evaluation
   * @param total - The total number of test cases
   */
  public start(name: string, total: number): void {
    this.total = total;
    const message = `\nRunning evaluation "${name}" with ${total} test cases...`;
    if (this.logger) {
      this.logger.info(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Report the completion of a test case and update the progress counter.
   *
   * @param testCaseName - The name of the completed test case
   */
  public increment(testCaseName: string): void {
    this.count++;
    const message = `[${this.count}/${this.total}] Running test case: "${testCaseName}"`;
    if (this.logger) {
      this.logger.info(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Report the completion of the evaluation run.
   */
  public stop(): void {
    const message = 'Evaluation complete.';
    if (this.logger) {
      this.logger.info(message);
    } else {
      console.log(message);
    }
  }
}

/**
 * Interactive progress bar reporter using cli-progress library.
 * Creates a visual progress bar that updates in place, ideal for
 * local development and interactive terminal sessions.
 *
 * @example Output format:
 * ```
 * ████████████████░░░░ | Test Case Name        | 80% | 40/50
 * ```
 *
 * @example Usage:
 * ```typescript
 * const reporter = new BarProgressReporter();
 * reporter.start('my-pipeline', 50);
 * for (let i = 0; i < 50; i++) {
 *   await processTestCase(i);
 *   reporter.increment(`Test ${i}`);
 * }
 * reporter.stop();
 * ```
 *
 * @remarks
 * - Test case names longer than 40 characters will be truncated with ellipsis
 * - The progress bar updates in place and requires an interactive terminal
 * - Not suitable for CI/CD environments or when output needs to be logged
 */
export class BarProgressReporter implements ProgressReporter {
  private multiBar: cliProgress.MultiBar;
  private bar: cliProgress.SingleBar | null = null;
  private currentValue = 0;

  /**
   * Creates a new BarProgressReporter instance with a configured progress bar.
   */
  constructor() {
    this.multiBar = new cliProgress.MultiBar(
      {
        clearOnComplete: false,
        format: ' {bar} | {currentTest} | {percentage}% | {value}/{total}',
        autopadding: true,
      },
      cliProgress.Presets.shades_grey,
    );
  }

  /**
   * Initialize a new progress bar for the evaluation run.
   *
   * @param name - The name or identifier of the evaluation (e.g., pipeline ID)
   * @param total - The total number of test cases
   */
  public start(name: string, total: number): void {
    this.currentValue = 0;
    this.bar = this.multiBar.create(total, 0, {
      currentTest: fitNameToSpaces('Starting...'),
    });
  }

  /**
   * Update the display to show the current test case being processed.
   *
   * @param testCaseName - The name of the test case currently being processed
   */
  public updateCurrentTest(testCaseName: string): void {
    if (this.bar) {
      this.bar.update(this.currentValue, {
        currentTest: fitNameToSpaces(testCaseName),
      });
    }
  }

  /**
   * Report the completion of a test case and increment the progress bar.
   *
   * @param testCaseName - The name of the completed test case
   */
  public increment(testCaseName: string): void {
    if (this.bar) {
      this.currentValue++;
      this.bar.update(this.currentValue, {
        currentTest: fitNameToSpaces('Completed: ' + testCaseName),
      });
    }
  }

  /**
   * Report the completion of the evaluation run and finalize the progress bar.
   * The final state of the bar will remain visible in the terminal.
   */
  public stop(): void {
    if (this.bar) {
      this.bar.update(this.bar.getTotal(), {
        currentTest: fitNameToSpaces('Evaluation complete'),
      });
      this.bar.stop();
    }
    this.multiBar.stop();
  }
}
