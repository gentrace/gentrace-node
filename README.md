<!-- TEXT_SECTION:header:START -->
<h1 align="center">
Gentrace Node.js Monorepo
</h1>
<p align="center">
  <a href="https://github.com/gentrace/gentrace-node/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Gentrace is released under the MIT license." />
  </a>
  <a href="https://github.com/gentrace/gentrace-node/actions/workflows/release-please.yaml">
    <img src="https://github.com/gentrace/gentrace-node/actions/workflows/release-please.yaml/badge.svg" alt="Release Github action status" />
  </a>
</p>
<!-- TEXT_SECTION:header:END -->

## Packages

_Gentrace Core_ (`@gentrace/core`): core logic that implements important Gentrace abstractions and provides utilities for creating new plugins.

_Gentrace OpenAI_ (`@gentrace/openai`): plugin for the OpenAI SDK.

_Gentrace Pinecone_ (`@gentrace/pinecone`): plugin for the Pinecone SDK.

**Important note**: this library is meant for server-side usage only, as using it in client-side browser code will expose your secret API key.

## Installation

```bash
# Gentrace core
npm install @gentrace/core

# Gentrace OpenAI plugin
npm install @gentrace/openai

# Gentrace Pinecone plugin
npm install @gentrace/pinecone
```

## Getting started

Visit our [docs](https://gentrace.ai/docs) to learn how to get started.
