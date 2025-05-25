# Gentrace Node.js SDK

[![NPM version](https://img.shields.io/npm/v/gentrace.svg)](https://npmjs.org/package/gentrace) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/gentrace)

This library provides tools to instrument and test your AI applications using Gentrace.

The API reference documentation, auto-generated from our Stainless client code, can be found in [api.md](api.md).

## Installation

```sh
yarn add gentrace
```

## Core Concepts

The Gentrace SDK provides several key functions to help you instrument and evaluate your AI pipelines:

- **`init`**: Initializes the Gentrace SDK with your API key and other configuration.
- **`interaction`** / **`traced`**: Wraps your core AI logic (like calls to OpenAI, Anthropic, etc.) to capture traces and metadata. ([Requires OpenTelemetry](#opentelemetry-integration))
- **`experiment`**: Defines a testing context for grouping related tests. ([Requires OpenTelemetry](#opentelemetry-integration))
- **`evalOnce`**: Runs a single test case within an experiment. ([Requires OpenTelemetry](#opentelemetry-integration))
- **`evalDataset`**: Runs tests based on a dataset defined in Gentrace. ([Requires OpenTelemetry](#opentelemetry-integration))

> [!NOTE]
> The instrumentation features (`interaction`, `traced`, `evalOnce`, `evalDataset`) rely on OpenTelemetry being configured. Please see the [OpenTelemetry Integration](#opentelemetry-integration) section for setup instructions before using these features.

## Basic Usage

### Initialization (`init`)

First, initialize the SDK with your Gentrace API key. You typically do this once when your application starts.

> [!TIP]
> You can create your Gentrace API key at [https://gentrace.ai/s/api-keys](https://gentrace.ai/s/api-keys)

<!-- prettier-ignore -->
```typescript
import { init } from 'gentrace';

init({
  apiKey: process.env.GENTRACE_API_KEY,
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
  'Query AI', // Explicitly set the name of the interaction
  queryAi, // Pass the original function
  {
    pipelineId: GENTRACE_PIPELINE_ID,
  }
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

### Lower-Level Tracing (`traced`)

Use the `traced` decorator to wrap any given function with OpenTelemetry tracing, creating a span for its execution. This is useful for instrumenting helper functions or specific blocks of code within a larger `interaction`.

<!-- prettier-ignore -->
```typescript
import { traced, interaction } from 'gentrace';
import OpenAI from 'openai';
import { dbCall } from './db';

const openai = new OpenAI();

const summarizeUser = traced('OpenAI Call', async (userInfo: string) => {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: `Summarize the following user info: ${userInfo}` }]
  });
  return res.choices[0]?.message?.content || '';
});

const tracedGetUserInfo = traced(
  'Get User Info DB Call',
  async (userId: string) => {
    return dbCall(userId);
  }
);

const instrumentedMainTask = interaction(
  '<pipeline UUID>',
  async ({ input }: { input: string }) => {
    const userInfo = await tracedGetUserInfo(input);
    return summarizeUser(userInfo);
  },
  { name: 'Main Task' }
);

async function run() {
  const result = await instrumentedMainTask({ input: "test data" });
  console.log(result);
}

run();
```

The `traced` function requires an explicit `name` option for the span it creates. You can also provide additional `attributes` to be added to the span. Like `interaction`, this also requires OpenTelemetry to be set up.

> [!WARNING]  
> This example assumes you have already set up OpenTelemetry as described in the [OpenTelemetry Integration](#opentelemetry-integration) section. Both the `interaction` and `traced` functions require this setup to capture and send traces.
> Now, every time `instrumentedQueryAi` is called, Gentrace will record a trace associated with your `GENTRACE_PIPELINE_ID`.

## Testing and Evaluation

Gentrace provides powerful tools for testing your AI applications.

### Running Single Tests (`evalOnce`)

Use `experiment` to group tests and `evalOnce` to define individual test cases.

**`src/tests/simple.ts`**:

<!-- prettier-ignore -->
```typescript
import { init, experiment, evalOnce } from 'gentrace';
import { instrumentedQueryAi } from '../instrumentedAi'; // Your instrumented function

init();

const GENTRACE_PIPELINE_ID = process.env.GENTRACE_PIPELINE_ID!;

// 🚧 Add OpenTelemetry setup (view the OTEL section below)

experiment(GENTRACE_PIPELINE_ID, async () => {
  evalOnce('simple-query-test', async () => {
    const capital = await instrumentedQueryAi({ query: 'What is the capital of France?' });
    // You can add assertions here if needed, exceptions will get captured and recorded on the
    // test span.
    console.log('Capital:', capital);
    return result; // Return value is captured in the span
  });

  evalOnce('another-query-test', async () => {
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

### Testing with Datasets (`evalDataset`)

You can run your instrumented functions against datasets defined in Gentrace. This is useful for regression testing and evaluating performance across many examples.

**`src/tests/dataset.ts`**:

<!-- prettier-ignore -->
```typescript
import { init, experiment, evalDataset, testCases } from 'gentrace';
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
  await evalDataset({
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
> While `zod` is used in the example, any schema validation library that conforms to the [Standard Schema](https://github.com/standard-schema/standard-schema) interface (like `zod`, `valibot`, `arktype`, etc.) can be used for the `schema` parameter. This interface requires the library to expose a `parse()` function, which `evalDataset` uses internally.

Run the dataset test:

```sh
GENTRACE_PIPELINE_ID=<your-pipeline-id> GENTRACE_DATASET_ID=<your-dataset-id> GENTRACE_API_KEY=<your-api-key> npx ts-node src/tests/dataset.ts
```

Gentrace will execute `instrumentedQueryAi` for each test case in your dataset and record the results.

## OpenTelemetry Integration

OpenTelemetry integration is **required** for the Gentrace SDK's instrumentation features (`interaction`, `test`, `evalDataset`) to function correctly. You must set up the OpenTelemetry SDK to capture and export traces to Gentrace.

> [!NOTE]  
> Modern package managers (like `pnpm` 8+, `yarn` 2+, and `npm` 7+) should automatically install the OTEL dependencies when you install `gentrace`. If the packages weren't already installed, you might need to install them manually.

<details>
<summary>Click here to view the command for installing OpenTelemetry peer dependencies manually</summary>

```sh
yarn add @opentelemetry/api@^1.9.0 @opentelemetry/context-async-hooks@^2.0.0 @opentelemetry/core@^2.0.0 @opentelemetry/exporter-trace-otlp-http@^0.200.0 @opentelemetry/resources@^2.0.0 @opentelemetry/sdk-node@^0.200.0 @opentelemetry/sdk-trace-node@^2.0.0 @opentelemetry/semantic-conventions@^1.25.0 @opentelemetry/baggage-span-processor@^0.4.0
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

// Define the API key at the top
const GENTRACE_API_KEY = process.env.GENTRACE_API_KEY || '';

// Optional: Add validation to ensure the API key is set
if (!GENTRACE_API_KEY) {
  throw new Error('GENTRACE_API_KEY must be set');
}

// Initialize the OpenTelemetry SDK with GentraceSampler
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
```

The `GentraceSpanProcessor` is a specialized OpenTelemetry span processor. It specifically looks for the `gentrace.sample` baggage key in the current OpenTelemetry context. If found, it extracts this baggage key and adds it as an attribute to new spans. This makes sure that the sampling attribute is propagated correctly to all spans that need to be tracked by Gentrace.

Gentrace also provides a `GentraceSampler`. You can add this to your OpenTelemetry SDK configuration (as shown in the example above). The `GentraceSampler` will ensure that only spans containing the `gentrace.sample` baggage key (either in the context or as a span attribute with a value of `'true'`) are sampled and exported. This is useful for filtering out spans that are not relevant to Gentrace tracing, reducing noise and data volume.

### How GentraceSampler Works

The `GentraceSampler` filters spans based on the presence of a `gentrace.sample` attribute with a value of `'true'`. Here's a simple example of how it works:

```typescript
// Import the GentraceSampler
import { GentraceSampler } from 'gentrace';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Define the API key at the top
const GENTRACE_API_KEY = process.env.GENTRACE_API_KEY || '';

// Optional: Add validation to ensure the API key is set
if (!GENTRACE_API_KEY) {
  throw new Error('GENTRACE_API_KEY must be set');
}

// Initialize the OpenTelemetry SDK with GentraceSampler
const sdk = new NodeSDK({
  // ... other configuration options
  traceExporter: new OTLPTraceExporter({
    url: 'https://gentrace.ai/api/otel/v1/traces',
    headers: { Authorization: `Bearer ${GENTRACE_API_KEY}` },
  }),
  // Add the GentraceSampler to filter spans
  sampler: new GentraceSampler(),
});

// Start the SDK
sdk.start();

// Create spans in your application
// Only spans with gentrace.sample='true' will be exported
// For example:
// - Spans created by Gentrace SDK helpers (like interaction()) will have this attribute set
// - Spans without this attribute will be filtered out by the GentraceSampler
```

To ensure only relevant traces are sent to Gentrace, you have two main approaches for sampling and filtering, both of which use Gentrace-specific OpenTelemetry components:

**1. In-Process Sampling (Recommended for most use cases)**

This approach allows your application to decide which traces are sampled and sent directly to Gentrace, reducing the volume of telemetry data leaving your application.

- **Motivation**: Control sampling logic within your application, minimize outgoing data, and reduce processing load on an external collector for basic filtering.
- **Components**:
  - `GentraceSampler`: Add this to your OpenTelemetry SDK configuration (as shown in the setup example above).
    - **Role**: During span creation, the `GentraceSampler` checks for the `gentrace.sample` key in the OpenTelemetry Baggage (propagated from the parent context, often by Gentrace SDK helpers like `interaction()`) or as an initial span attribute.
    - If `gentrace.sample` is found and set to `'true'`, the sampler decides to assign `RECORD_AND_SAMPLED`, meaning the span will be exported. Otherwise, it may decide `NOT_RECORD`.
  - `GentraceSpanProcessor` (Recommended): While the `GentraceSampler` makes the core sampling decision, including the `GentraceSpanProcessor` ensures the `gentrace.sample="true"` attribute is explicitly added to the span. This is best practice for visibility and crucial if you might ever use an OpenTelemetry Collector or other attribute-aware tools.

**2. Collector-Based Filtering/Sampling**

In this model, your application might send a broader set of traces (or all traces) to an OpenTelemetry Collector. The Collector is then configured to filter these traces and forward only the relevant ones to Gentrace.

- **Motivation**: Centralize complex sampling or filtering logic outside your application, leverage advanced Collector features (like tail-based sampling or routing to multiple backends), and offload processing from your application.
- **Components**:
  - `GentraceSpanProcessor` (in your application's SDK):
    - **Role**: Its primary role remains the same: to read `gentrace.sample` from Baggage and ensure the `gentrace.sample="true"` attribute is added to spans. This attribute is then used by the Collector for its filtering rules.
  - OpenTelemetry Collector (external service):
    - **Role**: You configure the Collector with a pipeline that includes a filter processor. This processor is set up to look for spans with the `gentrace.sample="true"` attribute. Only these spans are then exported from the Collector to Gentrace.
    - For detailed instructions on this setup, refer to the [Gentrace OpenTelemetry Setup Guide](https://gentrace.ai/docs/opentelemetry/setup-with-open-telemetry#2-collector-based-filtering) and the official [OpenTelemetry Collector documentation](https://opentelemetry.io/docs/collector/).

### Information Flow Visualizations

#### In-Process Sampling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Your Application                           │
│                                                                 │
│  ┌───────────────┐     ┌───────────────────────────────────┐    │
│  │               │     │                                   │    │
│  │  Application  │────▶│  GentraceSampler                  │    │
│  │  Code         │     │  - Reads gentrace.sample          │    │
│  │               │     │    from Baggage                   │    │
│  └───────────────┘     │  - Filters spans with             │    │
│                        │    gentrace.sample="true"         │    │
│                        │                                   │    │
│                        └───────────────┬───────────────────┘    │
│                                        │                        │
└────────────────────────────────────────┼────────────────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │                             │
                          │  Gentrace Backend           │
                          │                             │
                          └─────────────────────────────┘
```

#### OpenTelemetry Collector Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Your Application                           │
│                                                                 │
│  ┌───────────────┐     ┌───────────────────────────────────┐    │
│  │               │     │                                   │    │
│  │  Application  │────▶│  GentraceSpanProcessor            │    │
│  │  Code         │     │  - Reads gentrace.sample          │    │
│  │               │     │    from Baggage                   │    │
│  └───────────────┘     │  - Adds gentrace.sample="true"    │    │
│                        │    to spans                       │    │
│                        │                                   │    │
│                        └───────────────┬───────────────────┘    │
│                                        │                        │
└────────────────────────────────────────┼────────────────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │                             │
                          │  OpenTelemetry Collector    │
                          │  ┌─────────────────────┐    │
                          │  │ Filter Processor    │    │
                          │  │ - Filters spans with│    │
                          │  │   gentrace.sample   │    │
                          │  │   ="true" attribute │    │
                          │  └──────────┬──────────┘    │
                          │             │               │
                          └─────────────┼───────────────┘
                                        │
                                        ▼
                          ┌─────────────────────────────┐
                          │                             │
                          │  Gentrace Backend           │
                          │                             │
                          └─────────────────────────────┘
```

In both scenarios, the Gentrace SDK helper functions (like `interaction()` and `evalOnce()`) typically handle setting the `gentrace.sample` value in the OpenTelemetry Baggage for the operations they trace.

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
