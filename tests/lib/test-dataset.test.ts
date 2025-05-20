import { TestInput } from '../../src/lib/test-dataset';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
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

describe('testDataset', () => {
  let mockGetCurrentExperimentContext: jest.Mock;
  let mockRunTest: jest.Mock;
  let mockGetClient: jest.Mock;
  let testDatasetLib: typeof import('../../src/lib/test-dataset');

  beforeEach((done) => {
    jest.isolateModules(() => {
      jest.doMock('../../src/lib/experiment', () => ({
        experiment: jest.fn(async (pipelineId: string, callback: () => Promise<any>) => {
          await callback();
        }),
        getCurrentExperimentContext: jest.fn(),
      }));
      jest.doMock('../../src/lib/test-single', () => ({
        _runTest: jest.fn(),
      }));
      jest.doMock('../../src/lib/client-instance', () => ({
        _getClient: jest.fn(),
      }));

      const testModule = require('../../src/lib/test-single');
      const experimentModule = require('../../src/lib/experiment');
      const clientInstanceModule = require('../../src/lib/client-instance');
      testDatasetLib = require('../../src/lib/test-dataset');

      jest.clearAllMocks();

      mockRunTest = testModule._runTest as jest.Mock;
      mockGetCurrentExperimentContext = experimentModule.getCurrentExperimentContext as jest.Mock;
      mockGetClient = clientInstanceModule._getClient as jest.Mock;

      mockRunTest.mockImplementation(async () => {
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
      testDatasetLib.testDataset({
        data: () => datasetSimple,
        interaction: mockInteraction,
        schema: InputSchema,
      }),
    ).rejects.toThrow('testDataset must be called within the context of an experiment block.');
  });

  it('should run tests for each item in a simple dataset using _runTest', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-1', pipelineId: 'pipe-1' });
    await testDatasetLib.testDataset({
      data: () => datasetSimple,
      interaction: mockInteraction,
      schema: InputSchema,
    });

    expect(mockRunTest).toHaveBeenCalledTimes(3);
    expect(mockRunTest).toHaveBeenCalledWith({
      spanName: 'Test Case 1',
      spanAttributes: { 'gentrace.test_case_name': 'Test Case 1' },
      inputs: { input: 1 },
      schema: InputSchema,
      callback: mockInteraction,
    });
    expect(mockRunTest).toHaveBeenCalledWith({
      spanName: 'Test Case 2',
      spanAttributes: { 'gentrace.test_case_name': 'Test Case 2' },
      inputs: { input: 2 },
      schema: InputSchema,
      callback: mockInteraction,
    });
    expect(mockRunTest).toHaveBeenCalledWith({
      spanName: 'Test Case 3',
      spanAttributes: { 'gentrace.test_case_name': 'Test Case 3' },
      inputs: { input: 3 },
      schema: InputSchema,
      callback: mockInteraction,
    });
  });

  it('should run tests for every item in a structured dataset using _runTest', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-2', pipelineId: 'pipe-2' });
    await testDatasetLib.testDataset({
      data: () => datasetStructured,
      interaction: mockInteraction,
      schema: InputSchema,
    });

    expect(mockRunTest).toHaveBeenCalledTimes(4);

    expect(mockRunTest).toHaveBeenCalledWith({
      spanName: 'Case 1',
      spanAttributes: { 'gentrace.test_case_name': 'Case 1' },
      inputs: { input: 10 },
      schema: InputSchema,
      callback: mockInteraction,
    });

    expect(mockRunTest).toHaveBeenCalledWith({
      spanName: 'Test Case (ID: case-id-20)',
      spanAttributes: { 'gentrace.test_case_id': 'case-id-20' },
      inputs: { input: 20 },
      schema: InputSchema,
      callback: mockInteraction,
    });

    expect(mockRunTest).toHaveBeenCalledWith({
      spanName: 'Case 30',
      spanAttributes: { 'gentrace.test_case_id': 'case-id-30' },
      inputs: { input: 30 },
      schema: InputSchema,
      callback: mockInteraction,
    });

    expect(mockRunTest).toHaveBeenCalledWith({
      spanName: 'Test Case 4',
      spanAttributes: { 'gentrace.test_case_name': 'Test Case 4' },
      inputs: { input: 40 },
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
    await testDatasetLib.testDataset({
      data: asyncDataset,
      interaction: mockInteraction,
      schema: InputSchema,
    });
    expect(mockRunTest).toHaveBeenCalledTimes(3);
  });

  it('should throw error if dataset function fails', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-5', pipelineId: 'pipe-5' });
    const error = new Error('Dataset fetch failed');
    const failingDataset = () => {
      throw error;
    };
    await expect(
      testDatasetLib.testDataset({
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
      testDatasetLib.testDataset({
        data: nonArrayDataset,
        interaction: mockInteraction,
        schema: InputSchema,
      }),
    ).rejects.toThrow('Dataset function must return an array of test cases.');
  });

  it('should warn and skip null/undefined items in dataset', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-7', pipelineId: 'pipe-7' });
    const datasetWithNull = [datasetSimple[0], null, datasetSimple[1], undefined];
    await testDatasetLib.testDataset({
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
    expect(mockRunTest).toHaveBeenCalledTimes(2);
  });

  it('should correctly handle dataset function returning a promise', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-9', pipelineId: 'pipe-9' });
    const promiseDataset = () => Promise.resolve(datasetSimple);
    await testDatasetLib.testDataset({
      data: promiseDataset,
      interaction: mockInteraction,
      schema: InputSchema,
    });
    expect(mockRunTest).toHaveBeenCalledTimes(3);
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

    await testDatasetLib.testDataset({
      data: () => customDataset,
      interaction: customInteraction,
      schema: CustomSchema,
    });

    expect(mockRunTest).toHaveBeenCalledTimes(1);
    expect(mockRunTest).toHaveBeenCalledWith({
      spanName: 'Test Case 1',
      spanAttributes: { 'gentrace.test_case_name': 'Test Case 1' },
      inputs: { input: 5 },
      schema: CustomSchema, // Check that the custom schema object is passed
      callback: customInteraction,
    });
  });

  it('should not throw if a custom schema parse fails (error handled by _runTest)', async () => {
    mockGetCurrentExperimentContext.mockReturnValue({ experimentId: 'exp-fail', pipelineId: 'pipe-fail' });

    const errorMsg = 'Intentionally failing parse';
    const FailingSchema = {
      parse: (input: unknown): { parsedInput: number } => {
        throw new Error(errorMsg);
      },
    };

    const failingInteraction = jest.fn(); // Won't be called if parse fails within _runTest

    const failingDataset: TestInput<{ input: number }>[] = [{ inputs: { input: 99 } }];

    // We expect testDataset to complete without throwing here, because the error
    // occurs inside the callback passed to _runTest, which catches it.
    await expect(
      testDatasetLib.testDataset({
        data: () => failingDataset,
        interaction: failingInteraction,
        schema: FailingSchema,
      }),
    ).resolves.toBeUndefined(); // Check that the function itself doesn't throw

    // Verify _runTest was still called (it handles the error internally)
    expect(mockRunTest).toHaveBeenCalledTimes(1);
    expect(mockRunTest).toHaveBeenCalledWith({
      spanName: 'Test Case 1',
      spanAttributes: { 'gentrace.test_case_name': 'Test Case 1' },
      inputs: { input: 99 },
      schema: FailingSchema, // The failing schema is passed
      callback: failingInteraction,
    });
  });
});
