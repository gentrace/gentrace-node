import { beforeEach, describe, expect, it, jest, afterEach } from '@jest/globals';
import { SimpleProgressReporter, BarProgressReporter, ProgressReporter } from '../../src/lib/progress';

describe('Progress Reporters', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('SimpleProgressReporter', () => {
    let reporter: SimpleProgressReporter;

    beforeEach(() => {
      reporter = new SimpleProgressReporter();
    });

    it('should implement ProgressReporter interface', () => {
      expect(reporter).toHaveProperty('start');
      expect(reporter).toHaveProperty('increment');
      expect(reporter).toHaveProperty('stop');
    });

    it('should log start message with total count', () => {
      reporter.start('test-pipeline-123', 25);

      expect(consoleLogSpy).toHaveBeenCalledWith('\nRunning experiment with 25 test cases...');
    });

    it('should use singular "case" for single test', () => {
      reporter.start('test-pipeline-123', 1);

      expect(consoleLogSpy).toHaveBeenCalledWith('\nRunning experiment with 1 test case...');
    });

    it('should log each test case with incrementing counter', () => {
      reporter.start('test-pipeline', 3);

      reporter.increment('Test Case A');
      expect(consoleLogSpy).toHaveBeenCalledWith('[1/3] Running test case: "Test Case A"');

      reporter.increment('Test Case B');
      expect(consoleLogSpy).toHaveBeenCalledWith('[2/3] Running test case: "Test Case B"');

      reporter.increment('Test Case C');
      expect(consoleLogSpy).toHaveBeenCalledWith('[3/3] Running test case: "Test Case C"');
    });

    it('should log completion message on stop', () => {
      reporter.start('test-pipeline', 10);
      reporter.stop();

      expect(consoleLogSpy).toHaveBeenCalledWith('Evaluation complete.');
    });

    it('should handle long test case names', () => {
      reporter.start('test-pipeline', 2);

      const longName = 'This is a very long test case name that should be displayed in full in CI/CD logs';
      reporter.increment(longName);

      expect(consoleLogSpy).toHaveBeenCalledWith(`[1/2] Running test case: "${longName}"`);
    });

    it('should maintain accurate count across multiple increments', () => {
      reporter.start('test-pipeline', 100);

      for (let i = 1; i <= 10; i++) {
        reporter.increment(`Test ${i}`);
      }

      expect(consoleLogSpy).toHaveBeenCalledTimes(11); // 1 start + 10 increments
      expect(consoleLogSpy).toHaveBeenNthCalledWith(11, '[10/100] Running test case: "Test 10"');
    });
  });

  describe('BarProgressReporter', () => {
    it('should implement ProgressReporter interface', () => {
      const reporter = new BarProgressReporter();

      expect(reporter).toHaveProperty('start');
      expect(reporter).toHaveProperty('increment');
      expect(reporter).toHaveProperty('stop');
    });

    it('should create BarProgressReporter without errors', () => {
      expect(() => new BarProgressReporter()).not.toThrow();
    });

    it('should handle full lifecycle without errors', () => {
      const reporter = new BarProgressReporter();

      expect(() => {
        reporter.start('test', 5);
        reporter.increment('Test 1');
        reporter.increment('Test 2');
        reporter.stop();
      }).not.toThrow();
    });

    it('should handle stop without starting', () => {
      const reporter = new BarProgressReporter();

      expect(() => {
        reporter.stop();
      }).not.toThrow();
    });

    it('should handle increment without starting', () => {
      const reporter = new BarProgressReporter();

      expect(() => {
        reporter.increment('Test');
      }).not.toThrow();
    });

    it('should handle multiple starts', () => {
      const reporter = new BarProgressReporter();

      expect(() => {
        reporter.start('test1', 5);
        reporter.increment('Test 1');
        reporter.stop();

        // This would be a new evaluation run
        reporter.start('test2', 3);
        reporter.increment('Test 2');
        reporter.stop();
      }).not.toThrow();
    });
  });

  describe('ProgressReporter interface compliance', () => {
    it('should ensure both reporters implement the same interface', () => {
      const simple = new SimpleProgressReporter();
      const bar = new BarProgressReporter();

      const interfaceMethods: Array<keyof ProgressReporter> = ['start', 'increment', 'stop'];

      interfaceMethods.forEach((method) => {
        if (method in simple && method in bar) {
          expect(typeof simple[method as keyof SimpleProgressReporter]).toBe('function');
          expect(typeof bar[method as keyof BarProgressReporter]).toBe('function');
        }
      });
    });

    it('should allow polymorphic usage', () => {
      const runWithReporter = (reporter: ProgressReporter) => {
        reporter.start('test', 3);
        reporter.increment('Test 1');
        reporter.increment('Test 2');
        reporter.increment('Test 3');
        reporter.stop();
      };

      expect(() => runWithReporter(new SimpleProgressReporter())).not.toThrow();
      expect(() => runWithReporter(new BarProgressReporter())).not.toThrow();
    });

    it('should handle same parameters for both reporters', () => {
      const testReporter = (reporter: ProgressReporter) => {
        // Test with various names
        reporter.start('short', 10);
        reporter.stop();

        reporter.start('a-very-long-pipeline-name-that-exceeds-normal-lengths', 100);
        reporter.stop();

        // Test with various test counts
        reporter.start('test', 0);
        reporter.stop();

        reporter.start('test', 1);
        reporter.increment('Single test');
        reporter.stop();

        reporter.start('test', 1000);
        for (let i = 0; i < 10; i++) {
          reporter.increment(`Test ${i}`);
        }
        reporter.stop();
      };

      expect(() => testReporter(new SimpleProgressReporter())).not.toThrow();
      expect(() => testReporter(new BarProgressReporter())).not.toThrow();
    });
  });

  describe('fitNameToSpaces helper function behavior', () => {
    it('should handle names in BarProgressReporter correctly', () => {
      const reporter = new BarProgressReporter();

      // Test that various name lengths work without throwing
      const names = [
        'a',
        'short',
        'exactly-40-characters-padded-name------',
        'this-is-a-very-long-name-that-definitely-exceeds-forty-characters',
        'name-with-39-chars-should-be-padded---',
        'name-with-41-chars-should-be-truncated--',
        '',
      ];

      names.forEach((name) => {
        expect(() => {
          reporter.start(name, 5);
          reporter.stop();
        }).not.toThrow();
      });
    });
  });

  describe('SimpleProgressReporter with logger', () => {
    it('should use logger when provided', () => {
      const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      };

      const reporter = new SimpleProgressReporter(mockLogger);

      reporter.start('test-pipeline', 2);
      expect(mockLogger.info).toHaveBeenCalledWith('\nRunning experiment with 2 test cases...');

      reporter.increment('Test 1');
      expect(mockLogger.info).toHaveBeenCalledWith('[1/2] Running test case: "Test 1"');

      reporter.stop();
      expect(mockLogger.info).toHaveBeenCalledWith('Evaluation complete.');

      // Console should not be called when logger is provided
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should fall back to console when logger is not provided', () => {
      const reporter = new SimpleProgressReporter();

      reporter.start('test-pipeline', 1);
      expect(consoleLogSpy).toHaveBeenCalledWith('\nRunning experiment with 1 test case...');

      reporter.increment('Test');
      expect(consoleLogSpy).toHaveBeenCalledWith('[1/1] Running test case: "Test"');

      reporter.stop();
      expect(consoleLogSpy).toHaveBeenCalledWith('Evaluation complete.');
    });
  });
});
