# Gentrace Node.js SDK Examples

This directory contains examples demonstrating key features of the Gentrace Node.js SDK.

## Examples Overview

### Basic Initialization & Configuration

- `custom-configuration.ts` - Custom OpenTelemetry configuration with service name, sampler, and resource attributes
- `manual-otel.ts` - Manual OpenTelemetry SDK setup for full control over tracing

### AI SDK Integrations

- `openai-ai-sdk.ts` - Simple OpenAI integration with Vercel AI SDK for text generation
- `anthropic-ai-sdk.ts` - Anthropic Claude integration with Vercel AI SDK
- `streaming-ai-sdk.ts` - Streaming responses from AI models with real-time output
- `mastra-ai-sdk.ts` - Integration with Mastra framework and Vercel AI SDK

### Evaluation

- `evaluation.ts` - Basic evaluation example using evalOnce within experiments
- `evaluation-dataset.ts` - Advanced evaluation against datasets fetched from Gentrace

### Advanced OpenTelemetry

- `genai-semantic-conventions.ts` - Comprehensive GenAI semantic conventions implementation including chat completions and function calling

## Installation

### Install dependencies:

```bash
# with yarn
yarn install

# with pnpm
pnpm install

# with npm
npm install
```

## Running Examples

### 1. Set environment variables:

Create a `.env` file in the root of this repository with your API keys. Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Alternatively, you can set the environment variables in your terminal.

### 2. Run an individual example:

```bash
# with yarn
yarn example examples/openai-ai-sdk.ts

# with pnpm
pnpm example examples/openai-ai-sdk.ts

# with npm
npm run example examples/openai-ai-sdk.ts
```

For more comprehensive documentation on Gentrace, see the [docs](https://docs.gentrace.ai).
