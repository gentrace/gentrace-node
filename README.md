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

> [!IMPORTANT]
> This version of the Node.JS SDK is a monorepo that contains multiple different packages. Previously, we had separated [our v0 branch](https://github.com/gentrace/gentrace-node/tree/v0) and [our v1 branch](https://github.com/gentrace/gentrace-node/tree/v1) to support OpenAI v3 and v4, respectively. 
> 
> Visit the above URLs to learn more about how to install those deprecated packages.


## Packages

_Gentrace Core_ (`@gentrace/core`): core logic that implements important Gentrace abstractions and provides utilities for creating new plugins.


_Gentrace OpenAI v3_ (`@gentrace/openai@v3`): plugin for the OpenAI v3 SDK. This version is incompatible with v4.

_Gentrace OpenAI v4_ (`@gentrace/openai@v4`): plugin for the OpenAI v4 SDK. This version is incompatible with v3.

_Gentrace Pinecone_ (`@gentrace/pinecone`): plugin for the Pinecone SDK.



**Important note**: this library is meant for server-side usage only, as using it in client-side browser code will expose your secret API key.

## Installation

```bash
# Gentrace core
npm install @gentrace/core

# Gentrace OpenAI v3 plugin
npm install @gentrace/openai@v3

# Gentrace OpenAI v4 plugin
npm install @gentrace/openai@v4

# Gentrace Pinecone plugin
npm install @gentrace/pinecone
```

## Getting started

Visit our [Node.JS observe guides](https://docs.gentrace.ai/docs/observe-nodejs) to learn how to get started.

### API reference 

Visit our [API reference](https://docs.gentrace.ai/reference) to construct API requests interactively.
