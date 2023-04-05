
<!-- TEXT_SECTION:header:START -->
<h1 align="center">
Gentrace Node.js SDK
</h1>
<p align="center">
  <a href="https://github.com/linear/linear/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Gentrace is released under the MIT license." />
  </a>
  <a href="https://github.com/gentrace/gentrace-node/actions/workflows/release-please.yaml">
    <img src="https://github.com/gentrace/gentrace-node/actions/workflows/release-please.yaml/badge.svg" alt="Release Github action status" />
  </a>
</p>
<!-- TEXT_SECTION:header:END -->


The Gentrace Node.js library provides convenient access to the Gentrace API from Node.js applications. Most of the code in this library is generated from our [OpenAPI specification](https://github.com/gentrace/gentrace-openapi).

**Important note: this library is meant for server-side usage only, as using it in client-side browser code will expose your secret API key.**

## Installation

```bash
$ npm install @gentrace/node
```

## Usage

The library needs to be configured with your account's secret key, which is available on the [website](https://staging.gentrace.ai/t/<slug>/settings/api-keys). We recommend setting it as an environment variable. Here's an example of initializing the library with the API key loaded from an environment variable and creating a completion:

```javascript
TODO: insert code
```

Check out the [full API documentation](https://docs.gentrace.ai/docs/api-reference?lang=node.js) for examples of all the available functions.

### Request options

All of the available API request functions additionally contain an optional final parameter where you can pass custom [axios request options](https://axios-http.com/docs/req_config), for example:


```javascript
TODO: insert code
```

### Error handling

API requests can potentially return errors due to invalid inputs or other issues. These errors can be handled with a `try...catch` statement, and the error details can be found in either `error.response` or `error.message`:

```javascript
TODO: insert code
```
