import { TestInput } from '../../src/lib/eval-dataset';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ATTR_GENTRACE_TEST_CASE_ID } from 'gentrace/lib/otel/constants';
import { z } from 'zod';

const mockGentraceClient: {
  logger: { warn: jest.Mock; error: jest.Mock; info: jest.Mock };
} = {
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
};

describe('evalDataset', () => {
  let mockGetCurrentExperimentContext: jest.Mock;
  let mockEvalTest: jest.Mock;
  let mockGetClient: jest.Mock;
  let evalDatasetLib: typeof import('../../src/lib/eval-dataset');

  beforeEach((done) => {
    jest.isolateModules(() => {
      jest.doMock('../../src/lib/experiment', () => ({
        experiment: jest.fn(async (pipelineId: string, callback: () => Promise<any>) => {
          await callback();
        }),
        getCurrentExperimentContext: jest.fn(),
      }));
      jest.doMock('../../src/lib/eval-once', () => ({
        _runEval: jest.fn(),
      }));
      jest.doMock('../../src/lib/client-instance', () => ({
        _getClient: jest.fn(),
      }));

      const evalOnceModule = require('../../src/lib/eval-once');
      const experimentModule = require('../../src/lib/experiment');
      const clientInstanceModule = require('../../src/lib/client-instance');
      evalDatasetLib = require('../../src/lib/eval-dataset');

      jest.clearAllMocks();

      mockEvalTest = evalOnceModule._runEval as jest.Mock;
      mockGetCurrentExperimentContext = experimentModule.getCurrentExperimentContext as jest.Mock;
      mockGetClient = clientInstanceModule._getClient as jest.Mock;

      mockEvalTest.mockImplementation(async () => {
        return undefined;
      });

      mockGetClient.mockReturnValue(mockGentraceClient);

      done();
    });
  });

  const InputSchema = z.object({ input: z.number() });
  type InteractionInput = z.infer<typeof InputSchema>;
  const mockInteraction = jest.fn(
    async (params: InteractionInput): Promise<string> => `output: ${params.input}`,
  );

  const datasetSimple: TestInput<InteractionInput>[] = [
    { inputs: { input: 1 } },
    { inputs: { input: 2 } },
    { inputs: { input: 3 } },
  ];

  const datasetStructured: TestInput<InteractionInput>[] = [
    { name: 'Case 1', inputs: { input: 10 } },
    { id: 'case-id-20', inputs: { input: 20 } },
    { name: 'Case 30', id: 'case-id-30', inputs: { input: 30 } },
    { inputs: { input: 40 } },
  ];

  it('should throw error if called outside experiment context', async () => {
    mockGetCurrentExperimentContext.mockReturnValue(undefined);
    await expect(
      evalDatasetLib.evalDataset({
        data: () => datasetSimple,
        interaction: mockInteraction,
        schema: InputSchema,
      }),
    ).rejects.toThrow('evalDataset must be called within the context of an experiment block.');
  });

  it('should run tests for each item in a simple dataset using _runEval', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-1', pipelineId: 'pipe-1' });
    await evalDatasetLib.evalDataset({
      data: () => datasetSimple,
      interaction: mockInteraction,
      schema: InputSchema,
    });

    expect(mockEvalTest).toHaveBeenCalledTimes(3);
    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case 1',
      inputs: { input: 1 },
      spanAttributes: {},
      schema: InputSchema,
      callback: mockInteraction,
    });
    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case 2',
      inputs: { input: 2 },
      spanAttributes: {},
      schema: InputSchema,
      callback: mockInteraction,
    });
    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case 3',
      inputs: { input: 3 },
      spanAttributes: {},
      schema: InputSchema,
      callback: mockInteraction,
    });
  });

  it('should run tests for each item in a structured dataset using _runEval', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-2', pipelineId: 'pipe-2' });
    await evalDatasetLib.evalDataset({
      data: () => datasetStructured,
      interaction: mockInteraction,
      schema: InputSchema,
    });

    expect(mockEvalTest).toHaveBeenCalledTimes(4);

    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Case 1',
      inputs: { input: 10 },
      spanAttributes: {},
      schema: InputSchema,
      callback: mockInteraction,
    });

    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case (ID: case-id-20)',
      spanAttributes: { [ATTR_GENTRACE_TEST_CASE_ID]: 'case-id-20' },
      inputs: { input: 20 },
      schema: InputSchema,
      callback: mockInteraction,
    });

    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Case 30',
      spanAttributes: { [ATTR_GENTRACE_TEST_CASE_ID]: 'case-id-30' },
      inputs: { input: 30 },
      schema: InputSchema,
      callback: mockInteraction,
    });

    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case 4',
      inputs: { input: 40 },
      spanAttributes: {},
      schema: InputSchema,
      callback: mockInteraction,
    });
  });

  it('should handle async dataset function', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-4', pipelineId: 'pipe-4' });
    const asyncDataset = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return datasetSimple;
    };
    await evalDatasetLib.evalDataset({
      data: asyncDataset,
      interaction: mockInteraction,
      schema: InputSchema,
    });
    expect(mockEvalTest).toHaveBeenCalledTimes(3);
  });

  it('should throw error if dataset function fails', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-5', pipelineId: 'pipe-5' });
    const error = new Error('Dataset fetch failed');
    const failingDataset = () => {
      throw error;
    };
    await expect(
      evalDatasetLib.evalDataset({
        data: failingDataset,
        interaction: mockInteraction,
        schema: InputSchema,
      }),
    ).rejects.toThrow(`Failed to retrieve or process dataset: ${error.message}`);
  });

  it('should throw error if dataset function returns non-array', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-6', pipelineId: 'pipe-6' });
    const nonArrayDataset = () => ({ not: 'an array' }) as any;
    await expect(
      evalDatasetLib.evalDataset({
        data: nonArrayDataset,
        interaction: mockInteraction,
        schema: InputSchema,
      }),
    ).rejects.toThrow(
      'Dataset must be an array of test cases or a function that returns an array of test cases.',
    );
  });

  it('should warn and skip null/undefined items in dataset', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-7', pipelineId: 'pipe-7' });
    const datasetWithNull = [datasetSimple[0], null, datasetSimple[1], undefined];
    await evalDatasetLib.evalDataset({
      data: () => datasetWithNull as any[],
      interaction: mockInteraction,
      schema: InputSchema,
    });

    expect((mockGetClient() as typeof mockGentraceClient).logger.warn).toHaveBeenCalledTimes(2);
    expect((mockGetClient() as typeof mockGentraceClient).logger.warn).toHaveBeenCalledWith(
      'Skipping undefined or null test case at index 1',
    );
    expect((mockGetClient() as typeof mockGentraceClient).logger.warn).toHaveBeenCalledWith(
      'Skipping undefined or null test case at index 3',
    );
    expect(mockEvalTest).toHaveBeenCalledTimes(2);
  });

  it('should correctly handle dataset function returning a promise', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-9', pipelineId: 'pipe-9' });
    const promiseDataset = () => Promise.resolve(datasetSimple);
    await evalDatasetLib.evalDataset({
      data: promiseDataset,
      interaction: mockInteraction,
      schema: InputSchema,
    });
    expect(mockEvalTest).toHaveBeenCalledTimes(3);
  });

  // --- Tests for Custom Schemas ---

  it('should work with a custom non-Zod schema', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({
      experimentId: 'exp-custom',
      pipelineId: 'pipe-custom',
    });

    // Define a custom schema object
    const CustomSchema = {
      parse: (input: unknown): { parsedInput: number } => {
        if (typeof input !== 'object' || input === null || typeof (input as any).input !== 'number') {
          throw new Error('Custom schema validation failed');
        }
        return { parsedInput: (input as any).input * 10 };
      },
    };

    // Define interaction expecting the custom schema's output type
    const customInteraction = jest.fn(
      async (params: { parsedInput: number }): Promise<string> => `custom output: ${params.parsedInput}`,
    );

    const customDataset: TestInput<{ input: number }>[] = [{ inputs: { input: 5 } }];

    await evalDatasetLib.evalDataset({
      data: () => customDataset,
      interaction: customInteraction,
      schema: CustomSchema,
    });

    expect(mockEvalTest).toHaveBeenCalledTimes(1);
    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case 1',
      inputs: { input: 5 },
      spanAttributes: {},
      schema: CustomSchema, // Check that the custom schema object is passed
      callback: customInteraction,
    });
  });

  it('should not throw if a custom schema parse fails (error handled by _runEval)', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-fail', pipelineId: 'pipe-fail' });

    const errorMsg = 'Intentionally failing parse';
    const FailingSchema = {
      parse: (input: unknown): { parsedInput: number } => {
        throw new Error(errorMsg);
      },
    };

    const failingInteraction = jest.fn(); // Won't be called if parse fails within _runEval

    const failingDataset: TestInput<{ input: number }>[] = [{ inputs: { input: 99 } }];

    // We expect evalDataset to complete without throwing here, because the error
    // occurs inside the callback passed to _runEval, which catches it.
    await expect(
      evalDatasetLib.evalDataset({
        data: () => failingDataset,
        interaction: failingInteraction,
        schema: FailingSchema,
      }),
    ).resolves.toBeUndefined(); // Check that the function itself doesn't throw

    // Verify _runEval was still called (it handles the error internally)
    expect(mockEvalTest).toHaveBeenCalledTimes(1);
    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case 1',
      inputs: { input: 99 },
      spanAttributes: {},
      schema: FailingSchema, // The failing schema is passed
      callback: failingInteraction,
    });
  });

  // --- Tests for Concurrency Control ---

  it('should respect maxConcurrency when set', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-conc', pipelineId: 'pipe-conc' });

    // Track concurrent executions
    let currentlyRunning = 0;
    let maxConcurrentObserved = 0;

    // Mock _runEval to simulate async work and track concurrency
    mockEvalTest.mockImplementation(async () => {
      currentlyRunning++;
      maxConcurrentObserved = Math.max(maxConcurrentObserved, currentlyRunning);

      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 50));

      currentlyRunning--;
      return undefined;
    });

    // Create a larger dataset to test concurrency
    const largeDataset: TestInput<{ input: string }>[] = Array.from({ length: 10 }, (_, i) => ({
      inputs: { input: `test-${i}` },
    }));

    await evalDatasetLib.evalDataset({
      data: () => largeDataset,
      interaction: mockInteraction,
      schema: InputSchema,
      maxConcurrency: 3,
    });

    expect(mockEvalTest).toHaveBeenCalledTimes(10);
    expect(maxConcurrentObserved).toBeLessThanOrEqual(3);
    expect(maxConcurrentObserved).toBeGreaterThan(0);
  });

  // --- Tests for Plain Array Support ---

  it('should accept a plain array directly as data', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-plain', pipelineId: 'pipe-plain' });

    await evalDatasetLib.evalDataset({
      data: datasetSimple,
      interaction: mockInteraction,
      schema: InputSchema,
    });

    expect(mockEvalTest).toHaveBeenCalledTimes(3);
    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case 1',
      inputs: { input: 1 },
      spanAttributes: {},
      schema: InputSchema,
      callback: mockInteraction,
    });
    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case 2',
      inputs: { input: 2 },
      spanAttributes: {},
      schema: InputSchema,
      callback: mockInteraction,
    });
    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case 3',
      inputs: { input: 3 },
      spanAttributes: {},
      schema: InputSchema,
      callback: mockInteraction,
    });
  });

  it('should accept a plain array with structured test inputs', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({
      experimentId: 'exp-plain-struct',
      pipelineId: 'pipe-plain-struct',
    });

    await evalDatasetLib.evalDataset({
      data: datasetStructured,
      interaction: mockInteraction,
      schema: InputSchema,
    });

    expect(mockEvalTest).toHaveBeenCalledTimes(4);

    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Case 1',
      inputs: { input: 10 },
      spanAttributes: {},
      schema: InputSchema,
      callback: mockInteraction,
    });

    expect(mockEvalTest).toHaveBeenCalledWith({
      spanName: 'Test Case (ID: case-id-20)',
      spanAttributes: { [ATTR_GENTRACE_TEST_CASE_ID]: 'case-id-20' },
      inputs: { input: 20 },
      schema: InputSchema,
      callback: mockInteraction,
    });
  });

  it('should accept a plain array with maxConcurrency', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({
      experimentId: 'exp-plain-conc',
      pipelineId: 'pipe-plain-conc',
    });

    // Track concurrent executions
    let currentlyRunning = 0;
    let maxConcurrentObserved = 0;

    // Mock _runEval to simulate async work and track concurrency
    mockEvalTest.mockImplementation(async () => {
      currentlyRunning++;
      maxConcurrentObserved = Math.max(maxConcurrentObserved, currentlyRunning);

      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 50));

      currentlyRunning--;
      return undefined;
    });

    // Create a larger dataset to test concurrency
    const largeDataset: TestInput<{ input: string }>[] = Array.from({ length: 10 }, (_, i) => ({
      inputs: { input: `test-${i}` },
    }));

    await evalDatasetLib.evalDataset({
      data: largeDataset,
      interaction: mockInteraction,
      schema: InputSchema,
      maxConcurrency: 3,
    });

    expect(mockEvalTest).toHaveBeenCalledTimes(10);
    expect(maxConcurrentObserved).toBeLessThanOrEqual(3);
    expect(maxConcurrentObserved).toBeGreaterThan(0);
  });

  it('should run all tasks in parallel when maxConcurrency is not set', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({
      experimentId: 'exp-noconc',
      pipelineId: 'pipe-noconc',
    });

    // Track concurrent executions
    let currentlyRunning = 0;
    let maxConcurrentObserved = 0;

    // Mock _runEval to track concurrency without delay
    mockEvalTest.mockImplementation(async () => {
      currentlyRunning++;
      maxConcurrentObserved = Math.max(maxConcurrentObserved, currentlyRunning);

      // Minimal async to ensure all promises are created before any complete
      await Promise.resolve();

      currentlyRunning--;
      return undefined;
    });

    // Create a dataset
    const dataset: TestInput<{ input: string }>[] = Array.from({ length: 5 }, (_, i) => ({
      inputs: { input: `test-${i}` },
    }));

    await evalDatasetLib.evalDataset({
      data: () => dataset,
      interaction: mockInteraction,
      schema: InputSchema,
      // No maxConcurrency - should run all in parallel
    });

    expect(mockEvalTest).toHaveBeenCalledTimes(5);
    expect(maxConcurrentObserved).toBe(5); // All should run in parallel
  });
});
