# Gentrace Node.js SDK

[![NPM version](https://img.shields.io/npm/v/gentrace.svg)](https://npmjs.org/package/gentrace) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/gentrace)

This library provides tools to instrument and test your AI applications using Gentrace.

The API reference documentation, auto-generated from our Stainless client code, can be found in [api.md](api.md).

## Installation

```sh
# OR yarn add/pnpm install
npm install gentrace
```

## Core Concepts

The Gentrace SDK provides several key functions to help you instrument and evaluate your AI pipelines:

- **`init`**: Initializes the Gentrace SDK with your API key and other configuration.
- **`interaction`**: Wraps your core AI logic (like calls to OpenAI, Anthropic, etc.) to capture traces and metadata. ([Requires OpenTelemetry](#opentelemetry-integration))
- **`experiment`**: Defines a testing context for grouping related tests. ([Requires OpenTelemetry](#opentelemetry-integration))
- **`test`**: Runs a single test case within an experiment. ([Requires OpenTelemetry](#opentelemetry-integration))
- **`testDataset`**: Runs tests based on a dataset defined in Gentrace. ([Requires OpenTelemetry](#opentelemetry-integration))

> [!NOTE]
> The instrumentation features (`interaction`, `test`, `testDataset`) rely on OpenTelemetry being configured. Please see the [OpenTelemetry Integration](#opentelemetry-integration) section for setup instructions before using these features.

## Basic Usage

### Initialization (`init`)

First, initialize the SDK with your Gentrace API key. You typically do this once when your application starts.

<!-- prettier-ignore -->
```typescript
import { init } from 'gentrace';

init({
  bearerToken: process.env.GENTRACE_API_KEY,
  // Optional: Specify base URL if using self-hosted or enterprise Gentrace
  // The format should be: http(s)://<hostname>/api
  // baseURL: process.env.GENTRACE_BASE_URL,
});

console.log('Gentrace initialized!');
```

### Instrumenting Your Code (`interaction`)

Wrap the functions that contain your core AI logic using `interaction`. This allows Gentrace to capture detailed traces.

**`src/run.ts`**:

<!-- prettier-ignore -->
```typescript
import { init, interaction } from 'gentrace';
import dotenv from 'dotenv';

dotenv.config();

const GENTRACE_PIPELINE_ID = process.env.GENTRACE_PIPELINE_ID!;
const GENTRACE_API_KEY = process.env.GENTRACE_API_KEY!;

if (!GENTRACE_PIPELINE_ID || !GENTRACE_API_KEY) {
  throw new Error('GENTRACE_PIPELINE_ID and GENTRACE_API_KEY must be set');
}

init();

// Define the AI function directly in this file
async function queryAi({ query }: { query: string }): Promise<string | null> {
  console.log(`Received query: ${query}`);
  // Simulate an AI call with a fake response
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
  const fakeResponse = `This is a fake explanation for "${query}".`;
  return fakeResponse;
}

// 🚧 Add OpenTelemetry setup (view the OTEL section below)

// Create an instrumented version of the function
export const instrumentedQueryAi = interaction(
  GENTRACE_PIPELINE_ID,
  queryAi // Pass the original function
);

// Example of calling the instrumented function
async function run() {
  console.log('Running interaction example...');
  try {
    const explanation = await instrumentedQueryAi({ query: 'Explain quantum computing simply.' });
    console.log('Explanation:', explanation);
    console.log(`\nVisit https://gentrace.ai/s/pipeline/${GENTRACE_PIPELINE_ID} to see the trace.`);
  } catch (error) {
    console.error("Error running interaction example:", error);
  }
}

run();
```

```sh
GENTRACE_PIPELINE_ID=<your-pipeline-id> GENTRACE_API_KEY=<your-api-key> npx ts-node src/run.ts
```

> [!WARNING]  
> This example assumes you have already set up OpenTelemetry as described in the [OpenTelemetry Integration](#opentelemetry-integration) section. The `interaction` function requires this setup to capture and send traces.
> Now, every time `instrumentedQueryAi` is called, Gentrace will record a trace associated with your `GENTRACE_PIPELINE_ID`.

## Testing and Evaluation

Gentrace provides powerful tools for testing your AI applications.

### Running Single Tests (`test`)

Use `experiment` to group tests and `test` to define individual test cases.

**`src/tests/simple.ts`**:

<!-- prettier-ignore -->
```typescript
import { init, experiment, test } from 'gentrace';
import { instrumentedQueryAi } from '../instrumentedAi'; // Your instrumented function

init();

const GENTRACE_PIPELINE_ID = process.env.GENTRACE_PIPELINE_ID!;

// 🚧 Add OpenTelemetry setup (view the OTEL section below)

experiment(GENTRACE_PIPELINE_ID, async () => {
  test('simple-query-test', async () => {
    const capital = await instrumentedQueryAi({ query: 'What is the capital of France?' });
    // You can add assertions here if needed, exceptions will get captured and recorded on the
    // test span.
    console.log('Capital:', capital);
    return result; // Return value is captured in the span
  });

  test('another-query-test', async () => {
    const result = await instrumentedQueryAi({ query: 'Summarize the plot of Hamlet.' });
    console.log('Test Result:', result);
    return result;
  });
});
```

To run these tests, simply execute the file:

```sh
GENTRACE_PIPELINE_ID=<your-pipeline-id> GENTRACE_API_KEY=<your-api-key> npx ts-node src/tests/simple.ts
```

Results will be available in the experiment section corresponding to that particular pipeline.

> [!WARNING]  
> This testing example assumes you have already set up OpenTelemetry as described in the [OpenTelemetry Integration](#opentelemetry-integration) section, since we're using an instrumented function call that uses the OTEL SDK.

### Testing with Datasets (`testDataset`)

You can run your instrumented functions against datasets defined in Gentrace. This is useful for regression testing and evaluating performance across many examples.

**`src/tests/dataset.ts`**:

<!-- prettier-ignore -->
```typescript
import { init, experiment, testDataset, testCases } from 'gentrace';
import { instrumentedQueryAi } from '../instrumentedAi'; // Your instrumented function
import { z } from 'zod'; // For defining input schema

init();

// 🚧 Add OpenTelemetry setup (view the OTEL section below)

const GENTRACE_PIPELINE_ID = process.env.GENTRACE_PIPELINE_ID!;
const GENTRACE_DATASET_ID = process.env.GENTRACE_DATASET_ID!;

// Define the expected input schema for your test cases in the dataset
const InputSchema = z.object({
  query: z.string(),
});

experiment(GENTRACE_PIPELINE_ID, async () => {
  await testDataset({
    // Fetch test cases from your Gentrace dataset
    data: async () => {
      const testCaseList = await testCases.list({ datasetId: GENTRACE_DATASET_ID });
      return testCaseList.data;
    },
    // Provide the schema to validate the inputs for each test case in the dataset
    schema: InputSchema,
    // Provide the instrumented function to run against each test case
    interaction: instrumentedQueryAi,
  });
});
```

> [!NOTE]  
> While `zod` is used in the example, any schema validation library that conforms to the [Standard Schema](https://github.com/standard-schema/standard-schema) interface (like `zod`, `valibot`, `arktype`, etc.) can be used for the `schema` parameter. This interface requires the library to expose a `parse()` function, which `testDataset` uses internally.

Run the dataset test:

```sh
GENTRACE_PIPELINE_ID=<your-pipeline-id> GENTRACE_DATASET_ID=<your-dataset-id> GENTRACE_API_KEY=<your-api-key> npx ts-node src/tests/dataset.ts
```

Gentrace will execute `instrumentedQueryAi` for each test case in your dataset and record the results.

## OpenTelemetry Integration

OpenTelemetry integration is **required** for the Gentrace SDK's instrumentation features (`interaction`, `test`, `testDataset`) to function correctly. You must set up the OpenTelemetry SDK to capture and export traces to Gentrace.

> [!NOTE]  
> Modern package managers (like `pnpm` 8+, `yarn` 2+, and `npm` 7+) should automatically install the OTEL dependencies when you install `gentrace`. If the packages weren't already installed, you might need to install them manually.

<details>
<summary>Click here to view the command for installing OpenTelemetry peer dependencies manually</summary>

```sh
# OR use yarn or pnpm
npm i @opentelemetry/api@^1.9.0 @opentelemetry/context-async-hooks@^2.0.0 @opentelemetry/core@^2.0.0 @opentelemetry/exporter-trace-otlp-http@^0.200.0 @opentelemetry/resources@^2.0.0 @opentelemetry/sdk-node@^0.200.0 @opentelemetry/sdk-trace-node@^2.0.0 @opentelemetry/semantic-conventions@^1.25.0 @opentelemetry/baggage-span-processor@^0.4.0
```

</details>

The described OpenTelemetry setup supports both v1 and v2 of the spec, although v2 is preferred.

<!-- prettier-ignore -->
```typescript
import { init } from 'gentrace';

// 📋 Start copying OTEL imports
import { GentraceSpanProcessor, GentraceSampler } from "gentrace";
import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
// 📋 End copying imports

const GENTRACE_API_KEY = process.env.GENTRACE_API_KEY!;

init();

// 📋 Start copying OTEL setup
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'your-generative-ai-product',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'https://gentrace.ai/api/otel/v1/traces',
    headers: {
      Authorization: `Bearer ${GENTRACE_API_KEY}`,
    },
  }),
  sampler: new GentraceSampler(),
  spanProcessors: [
    new GentraceSpanProcessor()
  ],
  contextManager: (new AsyncLocalStorageContextManager()).enable()
});

sdk.start();
console.log('OpenTelemetry SDK started, exporting traces to Gentrace.');

// Ensures spans get flushed before the runtime exits
process.on('beforeExit', async () => {
  await sdk.shutdown();
});

// Ensures spans get flushed when the runtime is asked to terminate
process.on('SIGTERM', async () => {
  await sdk.shutdown();
});
// 📋 End copying OpenTelemetry setup

The `GentraceSpanProcessor` is a specialized OpenTelemetry span processor. It specifically looks for the `gentrace.sample` baggage key in the current OpenTelemetry context. If found, it extracts this baggage key and adds it as an attribute to new spans. This makes sure that the sampling attribute is propagated correctly to all spans that need to be tracked by Gentrace.

Gentrace provides a `GentraceSampler`. You can add this to your OpenTelemetry SDK configuration (as shown in the example above). The `GentraceSampler` will ensure that only spans containing the `gentrace.sample` baggage key (either in the context or as a span attribute with a value of `'true'`) are sampled and exported. This is useful for filtering out spans that are not relevant to Gentrace tracing, reducing noise and data volume.

Alternatively, if you are using the OpenTelemetry Collector, you can configure it to filter and send only the relevant Gentrace spans. This involves setting up a filter processor in your collector configuration to keep only spans where the attribute `gentrace.sample` is `"true"`. For detailed instructions on collector-based filtering, please refer to the [Gentrace OpenTelemetry Setup Guide](https://gentrace.ai/docs/opentelemetry/setup-with-open-telemetry#2-collector-based-filtering) and the official [OpenTelemetry Collector documentation](https://opentelemetry.io/docs/collector/).

See the `examples/` directory for runnable examples demonstrating these concepts with OpenTelemetry.

## Contributing

See [the contributing documentation](./CONTRIBUTING.md).

## Requirements

- Node.js 18 LTS or later.
- TypeScript >= 4.9 (optional, for type safety).

Note that React Native is not supported at this time.

If you are interested in other runtime environments, please open an issue on GitHub.

## Support

For questions or support, please reach out to us at [support@gentrace.ai](mailto:support@gentrace.ai).




















