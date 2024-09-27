# Changelog

## 2.8.3

### Patch Changes

- abe1d0a: fix: Export EvaluationType

## 2.8.2

### Patch Changes

- 3ee6ac6: feat: Add in getEvaluations() method

## 2.8.1

### Patch Changes

- 42fba9c: Fix lockfile
- 75c4bc9: Fix package versioning

## 2.8.0

### Minor Changes

- 6cd9aef: feat: Add unstructured outputs

## 2.7.2

### Patch Changes

- ed7da35: eFix error.config?.url

## 2.7.1

### Patch Changes

- 7a774c3: Add more diagnostics in error message

## 2.7.0

### Minor Changes

- 44a5d71: Add dataset support

## 2.6.1

### Patch Changes

- b487e37: Fix typing for submitTestRunners() and updateTestResultWithRunners()

## 2.6.0

### Minor Changes

- 6b1434d: Add test result update APIs

## 2.5.4

### Patch Changes

- afd3cb4: show more informative error message if available

## 2.5.3

### Patch Changes

- ccf00a4: add filtering parameter and support for pipeline ID

## 2.5.2

### Patch Changes

- b57cd45: Add addTestRunners() + submitTestRunners()

## 2.5.1

### Patch Changes

- 253dc4f: explicitly accept null value as getEvaluators parameter

## 2.5.0

### Minor Changes

- 72023e6: getEvaluators function

## 2.4.9

### Patch Changes

- 3f8a25a: feat(sdk): add showConnectionErrors param to init() w default to show every 10 seconds

## 2.4.8

### Patch Changes

- fc412d8: Add boolean type

## 2.4.7

### Patch Changes

- b5f953a: Allow checkpoint() to work against PipelineRun instantiation time

## 2.4.6

### Patch Changes

- d82c85b: getRun(runID) for API endpoint /v2/runs/:id

## 2.4.5

### Patch Changes

- ad988ed: Fix typing with selectFields()

## 2.4.4

### Patch Changes

- f54c4b0: Add redaction methods such as selectFields()

## 2.4.3

### Patch Changes

- d870178: Fix Acorn usage issue

## 2.4.2

### Patch Changes

- d87c652: allow SDK to connect to non-Localhost WebSocket servers

## 2.4.1

### Patch Changes

- 6744501: Playground SDK v0.1.0

## 2.4.0

### Minor Changes

- 24cb0aa: Add runner serialization

## 2.3.1

### Patch Changes

- 38ba3b7: Add more specific models for metadata

## 2.3.0

### Minor Changes

- 7291a00: fix: Modify how parameters are inferred by using Acorn.JS parser

## 2.2.13

### Patch Changes

- 3934529: Allow result to specified in runTest() and submitTestResult()

## 2.2.12

### Patch Changes

- 530759f: Fix uploadFile in Node 18+ environments.

## 2.2.11

### Patch Changes

- 981c398: Add SDK function for bulk creation

## 2.2.10

### Patch Changes

- 44b46f5: Fix submit test result typign

## 2.2.9

### Patch Changes

- e7e5f00: Modify runTest() for case filtering

## 2.2.8

### Patch Changes

- f51ee9c: Add test case get

## 2.2.7

### Patch Changes

- 2336d41: Add gentrace flush() operation

## 2.2.6

### Patch Changes

- 59a8477: Fix issues with fetch() not being available

## 2.2.5

### Patch Changes

- 033d1fa: Add file upload SDK endpoint

## 2.2.4

### Patch Changes

- 3441268: Fix naming to GENTRACE_RESULT_NAME

## 2.2.3

### Patch Changes

- 61e77d4: Add threading
- c15dc90: Add test result metadata

## 2.2.2

### Patch Changes

- 6e0f7b9: Add run metadata

## 2.2.1

### Patch Changes

- 7883953: Add test result endpoints

## 2.2.0

### Minor Changes

- 6811d80: Add HTML rendering option for steps

## 2.1.17

### Patch Changes

- b630a04: Add in test-result-simple handler
- cb5079a: fix: simpler Step Run
- 69fd657: Fix issue with pipeline slug not specified as a mandatory parameter

## 2.1.16

### Patch Changes

- 2c6a728: Add more test case endpoints for creation and updating

## 2.1.15

### Patch Changes

- 50f0fba: Refactor core logic, propagate changes to dependent packages, introduce v1 Pinecone plugin

## 2.1.14

### Patch Changes

- bb2ec90: Fix issues with dependencies
- 2cb370f: Fix issue with dotenv in tests
- 792f29c: Add tests for all packages, fix issues with empty plugins in core

## 2.1.13

### Patch Changes

- 6bfceb0: Fix issues with utility files

## 2.1.12

### Patch Changes

- 40073c3: Fix issues with test

## 2.1.11

### Patch Changes

- f54e583: Fix issues with frozen lockfile
- afce438: Fix issue with pnpm lock file

## 2.1.10

### Patch Changes

- 2bf3e0f: Fix issues with workflows and tests

## 2.1.9

### Patch Changes

- 3601617: Fix issues with privacy toggle

## 2.1.8

### Patch Changes

- 2d1ebd5: Fix issues with trying to publish already published packages

## 2.1.7

### Patch Changes

- d753973: Fix issue with privacy script not changing the name

## 2.1.6

### Patch Changes

- 6ddcdaa: Fix a few different issues

## 2.1.5

### Patch Changes

- 5fcdd89: Modify the lockfile installation semantics

## 2.1.4

### Patch Changes

- 07590a9: Make modifications to the installation process

## 2.1.3

### Patch Changes

- 8bb4e90: Fix a few smaller issues with deploy

## 2.1.2

### Patch Changes

- Convert private to public packages

## 2.1.1

### Patch Changes

- Migrate Node.JS SDK to monorepo with plugin-based system

## 2.1.0

### Minor Changes

- feat: Refactor package into a mono repo with TurboRepo and pnpm
