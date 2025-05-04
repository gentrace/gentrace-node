# Gentrace Node.js SDK

[![NPM version](https://img.shields.io/npm/v/gentrace.svg)](https://npmjs.org/package/gentrace) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/gentrace)

This library provides tools to instrument and test your AI applications using Gentrace.

The full API documentation can be found in [api.md](api.md).

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

## Basic Usage

### Initialization

First, initialize the SDK with your Gentrace API key. You typically do this once when your application starts.

<!-- prettier-ignore -->
```typescript
import { init } from 'gentrace';
import dotenv from 'dotenv';

dotenv.config();

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

Let's say you have a function `queryAi` that calls an AI model:

**`src/aiFunctions.ts`**:

<!-- prettier-ignore -->
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function queryAi({ query }: { query: string }): Promise<string | null> {
  // Your AI logic here, e.g., calling OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: query }],
  });
  return completion.choices[0]?.message?.content ?? null;
}
```

Now, wrap it with `interaction`:

**`src/instrumentedAi.ts`**:

<!-- prettier-ignore -->
```typescript
import { interaction } from 'gentrace';
import { queryAi } from './aiFunctions'; // Assuming your function is here

const GENTRACE_PIPELINE_ID = process.env.GENTRACE_PIPELINE_ID!;

// Create an instrumented version of your function
export const instrumentedQueryAi = interaction(
  GENTRACE_PIPELINE_ID,
  queryAi // Pass your original function
);

// Example of calling the instrumented function
async function run() {
  const result = await instrumentedQueryAi({ query: 'Explain quantum computing simply.' });
  console.log('AI Response:', result);
}

run();
```

Now, every time `instrumentedQueryAi` is called, Gentrace will record a trace associated with your `GENTRACE_PIPELINE_ID`.

## Testing and Evaluation

Gentrace provides powerful tools for testing your AI applications.

### Running Single Tests (`test`)

Use `experiment` to group tests and `test` to define individual test cases.

**`src/tests/simple.ts`**:

<!-- prettier-ignore -->
```typescript
import { init, experiment, test } from 'gentrace';
import { instrumentedQueryAi } from '../instrumentedAi'; // Your instrumented function
import dotenv from 'dotenv';

dotenv.config();

init({
  apiKey: process.env.GENTRACE_API_KEY,
});

const GENTRACE_PIPELINE_ID = process.env.GENTRACE_PIPELINE_ID!;

experiment(GENTRACE_PIPELINE_ID, async () => {
  test('simple-query-test', async () => {
    const result = await instrumentedQueryAi({ query: 'What is the capital of France?' });
    // You can add assertions here if needed, exceptions will get captured and recorded on the
    // test span.
    console.log('Test Result:', result);
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
npx ts-node src/tests/simple.ts
```

Results will be available in the experiment section corresponding to that particular pipeline.

### Testing with Datasets (`testDataset`)

You can run your instrumented functions against datasets defined in Gentrace. This is useful for regression testing and evaluating performance across many examples.

**`src/tests/dataset.ts`**:

<!-- prettier-ignore -->
```typescript
import { init, experiment, testDataset, testCases } from 'gentrace';
import { instrumentedQueryAi } from '../instrumentedAi'; // Your instrumented function
import { z } from 'zod'; // For defining input schema
import dotenv from 'dotenv';

dotenv.config();

init({
  apiKey: process.env.GENTRACE_API_KEY,
});

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

> Note: While `zod` is used in the example, any schema validation library that conforms to the [Standard Schema](https://github.com/standard-schema/standard-schema) interface (like `zod`, `valibot`, `arktype`, etc.) can be used for the `schema` parameter. This interface requires the library to expose a `parse()` function, which `testDataset` uses internally.

Run the dataset test:

```sh
npx ts-node src/tests/dataset.ts
```

Gentrace will execute `instrumentedQueryAi` for each test case in your dataset and record the results.

## OpenTelemetry Integration

OpenTelemetry integration is **required** for the Gentrace SDK's instrumentation features (`interaction`, `test`, `testDataset`) to function correctly. You must set up the OpenTelemetry SDK to capture and export traces to Gentrace.

> **Note:** Modern package managers (like `pnpm` 8+, `yarn` 2+, and `npm` 7+) should automatically install these peer dependencies when you install `gentrace`. If the packages weren't already installed, you might need to install them manually.

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
import dotenv from 'dotenv';
import { init } from 'gentrace';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BaggageSpanProcessor } from '@opentelemetry/baggage-span-processor';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';

dotenv.config();

const GENTRACE_API_KEY = process.env.GENTRACE_API_KEY!;

const OTEL_ENDPOINT = 'https://gentrace.ai/api/otel/v1/traces';

init({
  apiKey: GENTRACE_API_KEY,
});

// ====> COPY: Begin OpenTelemetry tracing
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'openai-email-composition-simplified',
  }),
  traceExporter: new OTLPTraceExporter({
    url: OTEL_ENDPOINT,
    headers: {
      Authorization: `Bearer ${GENTRACE_API_KEY}`,
    },
  }),
  spanProcessors: [
    new BaggageSpanProcessor((baggageKey: string) => baggageKey === 'gentrace.sample')
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
// ====> COPY: End OpenTelemetry tracing

// Now, any code run in this process that uses instrumented libraries
// (or manual OTel tracing) will send traces to Gentrace.
// You can still use `interaction` alongside this for specific function tracing.

// Example: Your application logic starts here
// import { instrumentedQueryAi } from './instrumentedAi';
// instrumentedQueryAi({ query: "What is OpenTelemetry?" });
```

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
