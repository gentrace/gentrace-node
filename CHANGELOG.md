# Changelog

## 0.12.2 (2025-07-29)

Full Changelog: [v0.12.1...v0.12.2](https://github.com/gentrace/gentrace-node/compare/v0.12.1...v0.12.2)

### Bug Fixes

* Fix warnings links to point to the new docs URL structure ([#630](https://github.com/gentrace/gentrace-node/issues/630)) ([b3920b0](https://github.com/gentrace/gentrace-node/commit/b3920b045f6c110ac3414e32edbbe11711e52a4f))
* force release of a new Node version ([7a0b839](https://github.com/gentrace/gentrace-node/commit/7a0b8399295561176aea12bc1616b5ef00076849))
* force release of a new Node version ([2eda66c](https://github.com/gentrace/gentrace-node/commit/2eda66c52583d347b25e00f730ea42cf217f5c6b))
* remove unused otelSetup option in init config ([8003978](https://github.com/gentrace/gentrace-node/commit/800397803a2d8157879954e6452e76d9618ce1f8))

## 0.12.1 (2025-07-28)

Full Changelog: [v0.12.0...v0.12.1](https://github.com/gentrace/gentrace-node/compare/v0.12.0...v0.12.1)

### Bug Fixes

* add an error for partial ingestion, unify logging with Stainless' logging system ([#625](https://github.com/gentrace/gentrace-node/issues/625)) ([127ccb2](https://github.com/gentrace/gentrace-node/commit/127ccb2e174a4d9d422e9329d9b1ff73724183f7))

## 0.12.0 (2025-07-24)

Full Changelog: [v0.11.2...v0.12.0](https://github.com/gentrace/gentrace-node/compare/v0.11.2...v0.12.0)

### Features

* **api:** api update ([c91f943](https://github.com/gentrace/gentrace-node/commit/c91f943833aa599396df23e8bebd2da7ca9868e3))
* **experiment:** support options-based pipelineId ([#623](https://github.com/gentrace/gentrace-node/issues/623)) ([7f655e0](https://github.com/gentrace/gentrace-node/commit/7f655e059217025e8cf9d85c1ac0b8b02f56104b))
* Make evalDataset() pass in the test case directly to the interaction ([#620](https://github.com/gentrace/gentrace-node/issues/620)) ([5220d29](https://github.com/gentrace/gentrace-node/commit/5220d290152986b721df73cc03b2b1c65cd860e2))

## 0.11.2 (2025-07-23)

Full Changelog: [v0.11.1...v0.11.2](https://github.com/gentrace/gentrace-node/compare/v0.11.1...v0.11.2)

## 0.11.1 (2025-07-22)

Full Changelog: [v0.11.1...v0.11.1](https://github.com/gentrace/gentrace-node/compare/v0.11.1...v0.11.1)

### Features

* add id to tool response message ([#619](https://github.com/gentrace/gentrace-node/issues/619)) ([520be14](https://github.com/gentrace/gentrace-node/commit/520be140cf9074a9be737ebfb4e5f07ea68c85eb))
* **api:** api update ([7c11157](https://github.com/gentrace/gentrace-node/commit/7c11157b8f805ea4309540bc44f2bdb0fd026592))
* **api:** correct the organization structure ([9289472](https://github.com/gentrace/gentrace-node/commit/92894723b6c0b9bd475959894cb332d3c0f58c9a))
* **api:** create organization methods ([1e8d425](https://github.com/gentrace/gentrace-node/commit/1e8d425981b3fd44453d777dd4e31cc92b99f0d6))
* **client:** add support for endpoint-specific base URLs ([6f9497d](https://github.com/gentrace/gentrace-node/commit/6f9497deeee86c83fd5a6a479e97401234a57db0))
* **experiment:** return experiment object metadata from `experiment()` invocation ([#614](https://github.com/gentrace/gentrace-node/issues/614)) ([e339cc7](https://github.com/gentrace/gentrace-node/commit/e339cc7e5e09307daf20db2c2f58c8eef815233b))
* **init:** warn on multiple init() with config diff ([#618](https://github.com/gentrace/gentrace-node/issues/618)) ([7dac470](https://github.com/gentrace/gentrace-node/commit/7dac470e60b91bb05b4a938091cfc643af9d4a80))
* **lib:** export organizations from init module ([#615](https://github.com/gentrace/gentrace-node/issues/615)) ([73b7666](https://github.com/gentrace/gentrace-node/commit/73b7666368685d19285a1da68859e52fc31dea26))
* simulate tool calls in function calling example ([#616](https://github.com/gentrace/gentrace-node/issues/616)) ([fef7a11](https://github.com/gentrace/gentrace-node/commit/fef7a11a5fd896f26e75006b8d4dc0e56bc539dc))


### Bug Fixes

* **ci:** release-doctor — report correct token name ([9dfae3a](https://github.com/gentrace/gentrace-node/commit/9dfae3a8f12879224f588077b2660deb9dfddbe5))
* **client:** explicitly copy fetch in withOptions ([0c0ccf7](https://github.com/gentrace/gentrace-node/commit/0c0ccf75d0560396ca56e0143e9b94592138058b))
* **client:** get fetchOptions type more reliably ([57c9858](https://github.com/gentrace/gentrace-node/commit/57c985824923f9b39c4d2a89e38c18c3b2102189))
* publish script — handle NPM errors correctly ([19fa166](https://github.com/gentrace/gentrace-node/commit/19fa1666cf2924faf75fce2d4610ade37a580739))


### Chores

* add docs to RequestOptions type ([8700520](https://github.com/gentrace/gentrace-node/commit/87005204b22b4faab91e26867c616f1d724f26a7))
* avoid type error in certain environments ([0cb5d3b](https://github.com/gentrace/gentrace-node/commit/0cb5d3bec53731fdadfe4b6e5d76e7207578da53))
* **ci:** enable for pull requests ([de2d55c](https://github.com/gentrace/gentrace-node/commit/de2d55cdfdf2bfe471bfa8a757c79b2fb47ccaf6))
* **ci:** only run for pushes and fork pull requests ([a0997e6](https://github.com/gentrace/gentrace-node/commit/a0997e675984d1752c9e332328177711b94ecea3))
* **client:** improve path param validation ([f4f7457](https://github.com/gentrace/gentrace-node/commit/f4f7457dfc67687da34216147e7fa4b544515d5e))
* **client:** refactor imports ([4ac48f4](https://github.com/gentrace/gentrace-node/commit/4ac48f40e2a958af5acf8b559c0ee660e23b10fb))
* **docs:** update import paths in examples ([#612](https://github.com/gentrace/gentrace-node/issues/612)) ([105b024](https://github.com/gentrace/gentrace-node/commit/105b02409b8782578d14689e5d3ea627b72d6e42))
* **internal:** add pure annotations, make base APIResource abstract ([db3c0cf](https://github.com/gentrace/gentrace-node/commit/db3c0cfcc68644d7fb481c5cc3158c07fe76cbb7))
* **internal:** fix readablestream types in node 20 ([ee564f1](https://github.com/gentrace/gentrace-node/commit/ee564f195b62a78ba2b3b6ec9df406d4e15ea095))
* **internal:** version bump ([dbf615d](https://github.com/gentrace/gentrace-node/commit/dbf615d40e4a76813ef21b6ea3546bd3c1a93b3c))
* **internal:** version bump ([d2ae6a6](https://github.com/gentrace/gentrace-node/commit/d2ae6a631db7c32dcd4a5058f416bec0c0403e36))
* **internal:** version bump ([17809b5](https://github.com/gentrace/gentrace-node/commit/17809b550337bd081f6e1f34e78c0874bd15b915))
* **internal:** version bump ([9a57d75](https://github.com/gentrace/gentrace-node/commit/9a57d751fdb3ae62b4cbe8dd1159dcbeb26af38c))
* **internal:** version bump ([734f58c](https://github.com/gentrace/gentrace-node/commit/734f58cd45a3acff765c30ee024d6b4d990c4d53))
* **internal:** version bump ([5891e37](https://github.com/gentrace/gentrace-node/commit/5891e37928dbd54985642f29042825521ce9e402))
* **internal:** version bump ([ab56d6d](https://github.com/gentrace/gentrace-node/commit/ab56d6d6f37ba73c8fdffa9857bfe37665e6c829))
* **internal:** version bump ([9ddd5e9](https://github.com/gentrace/gentrace-node/commit/9ddd5e9274479763e8258ec40b39211cae06def1))
* **internal:** version bump ([140aefe](https://github.com/gentrace/gentrace-node/commit/140aefefc2242274f1c1df73ca3be81d52a07e4e))
* **internal:** version bump ([80c6a0e](https://github.com/gentrace/gentrace-node/commit/80c6a0ee91a89979e71f1b3e0b6b73ef5db63c44))
* **internal:** version bump ([d5ebabd](https://github.com/gentrace/gentrace-node/commit/d5ebabdcc9ef0aa988096ce31cef6f8115b44aff))
* **internal:** version bump ([ac342f6](https://github.com/gentrace/gentrace-node/commit/ac342f66fc84c3eba4e305451e5e55dcc17fb68d))
* **internal:** version bump ([830e182](https://github.com/gentrace/gentrace-node/commit/830e182e66aded88c5fa3ce3eec11a518b40f7b3))
* make some internal functions async ([79c30e2](https://github.com/gentrace/gentrace-node/commit/79c30e23878a9fef61200f591616a7b896d4a240))
* **mcp:** rework imports in tools ([acc9c33](https://github.com/gentrace/gentrace-node/commit/acc9c3347e1bc0468dc63af99464e246a2f3a1dd))
* **readme:** update badges ([1077b3e](https://github.com/gentrace/gentrace-node/commit/1077b3e3b1eef0e3c1a0debfe422e59f9239ac36))
* **readme:** use better example snippet for undocumented params ([b16cbb4](https://github.com/gentrace/gentrace-node/commit/b16cbb4ff6d9c337f463fe41ec058215d0d0130e))
* **ts:** reorder package.json imports ([917c82f](https://github.com/gentrace/gentrace-node/commit/917c82feccf022706e9389c9f03ce2b881fd75ea))


### Refactors

* **types:** replace Record with mapped types ([cdedfcf](https://github.com/gentrace/gentrace-node/commit/cdedfcf249d60c0ba07055dde00b06a7a6bd1091))

## 0.11.1 (2025-07-16)

Full Changelog: [v0.11.0...v0.11.1](https://github.com/gentrace/gentrace-node/compare/v0.11.0...v0.11.1)

### Bug Fixes

* Create structured GentraceWarning that encapsulates a lot of the shared logic of issuing warnings ([#605](https://github.com/gentrace/gentrace-node/issues/605)) ([f9045ef](https://github.com/gentrace/gentrace-node/commit/f9045ef2331f5be96f77b916b25b5d0e089198c0))

## 0.11.0 (2025-07-15)

Full Changelog: [v0.10.0...v0.11.0](https://github.com/gentrace/gentrace-node/compare/v0.10.0...v0.11.0)

### Features

* Add Anthropic example for Node SDK similar to OpenAI ([#566](https://github.com/gentrace/gentrace-node/issues/566)) ([886b6b7](https://github.com/gentrace/gentrace-node/commit/886b6b701d47b6491abe4cbd684b931debb8efbc))
* Add ASCII visualizations for OpenTelemetry information flow ([#562](https://github.com/gentrace/gentrace-node/issues/562)) ([bfffd60](https://github.com/gentrace/gentrace-node/commit/bfffd6072b39f95bc57ac8c064319718fdb084a8))
* add baggage support to eval methods ([#569](https://github.com/gentrace/gentrace-node/issues/569)) ([#569](https://github.com/gentrace/gentrace-node/issues/569)) ([95564ba](https://github.com/gentrace/gentrace-node/commit/95564ba9aa3fd912e9e6727bda451f0dc87ef4ce))
* Add Claude Assistant GitHub Action workflow ([#558](https://github.com/gentrace/gentrace-node/issues/558)) ([952c9dd](https://github.com/gentrace/gentrace-node/commit/952c9dde4a94154df3e8cdcb409176c1a8716a5a))
* add PR title validation workflow ([#554](https://github.com/gentrace/gentrace-node/issues/554)) ([fb8636d](https://github.com/gentrace/gentrace-node/commit/fb8636de562ec218164de77dfff3cd24111c9abb))
* add release type to PR title validation ([#567](https://github.com/gentrace/gentrace-node/issues/567)) ([9404fb9](https://github.com/gentrace/gentrace-node/commit/9404fb92c2fe56944a52619166265ac8c4e116f3))
* **eval-dataset:** support plain array as dataset ([#606](https://github.com/gentrace/gentrace-node/issues/606)) ([698e56b](https://github.com/gentrace/gentrace-node/commit/698e56baa051ae2e5d39cb6afb58e4ff5ba5c33c))
* Introduce API/SDK observability wrappers ([#529](https://github.com/gentrace/gentrace-node/issues/529)) ([59cdf88](https://github.com/gentrace/gentrace-node/commit/59cdf883650ce3c1454919a97db627e00f991b35))


### Bug Fixes

* Add `Baggage` to the interaction to `gentrace.sample` ([#542](https://github.com/gentrace/gentrace-node/issues/542)) ([2b58351](https://github.com/gentrace/gentrace-node/commit/2b58351cc28aad5f4a50d19c9da4660f6e6198fc))
* Add await keyword before init function calls ([#586](https://github.com/gentrace/gentrace-node/issues/586)) ([37de686](https://github.com/gentrace/gentrace-node/commit/37de6865ba959d5f2c0cf4959e76add8ac90d208))
* Refactor attributes into constants ([#550](https://github.com/gentrace/gentrace-node/issues/550)) ([6a7e8d4](https://github.com/gentrace/gentrace-node/commit/6a7e8d41cace89a59691b26ee17e112b69152a43))
* update Jest config to transform yoctocolors package ([5a0323b](https://github.com/gentrace/gentrace-node/commit/5a0323b2f137afd678fb1b0fbaf07fdfe914b2a4))
* Update package manager instructions in README ([#533](https://github.com/gentrace/gentrace-node/issues/533)) ([c008abd](https://github.com/gentrace/gentrace-node/commit/c008abd83f343ffa5b80dbf7f4964935f3116697))
* **utils:** fix grammar in OpenTelemetry warning ([#609](https://github.com/gentrace/gentrace-node/issues/609)) ([9ec1f8f](https://github.com/gentrace/gentrace-node/commit/9ec1f8fa8c8980df5d5fb7f0db7595e5921fd8f4))
* Widen OTEL version range ([#536](https://github.com/gentrace/gentrace-node/issues/536)) ([64cdf97](https://github.com/gentrace/gentrace-node/commit/64cdf97f1b3d04e26e9cb883a4f16940cc4488d0))


### Chores

* add evaluation dataset example ([#589](https://github.com/gentrace/gentrace-node/issues/589)) ([#589](https://github.com/gentrace/gentrace-node/issues/589)) ([e021576](https://github.com/gentrace/gentrace-node/commit/e021576d556b8ec33637c0c157ebce64f827d85b))
* Add interaction name for simplicity ([#551](https://github.com/gentrace/gentrace-node/issues/551)) ([a866e5a](https://github.com/gentrace/gentrace-node/commit/a866e5a038c786a8619ff91438e42c98daa3e4e6))
* Detail `traced()` in the docs ([#552](https://github.com/gentrace/gentrace-node/issues/552)) ([3bf57ca](https://github.com/gentrace/gentrace-node/commit/3bf57ca0072778c9f14c7eabdbcbfed53b8dca5b))
* improve docs ([#602](https://github.com/gentrace/gentrace-node/issues/602)) ([1bec8ed](https://github.com/gentrace/gentrace-node/commit/1bec8ed45958fc36f42972df82c2d86a2faeb9ef))
* Remove test_case_name attribute ([#548](https://github.com/gentrace/gentrace-node/issues/548)) ([29d01e7](https://github.com/gentrace/gentrace-node/commit/29d01e7d89d568014b524a8502a531cad9ed7a97))
* Rename to evalOnce() and evalDataset() ([#549](https://github.com/gentrace/gentrace-node/issues/549)) ([8301950](https://github.com/gentrace/gentrace-node/commit/8301950c4219c6b70f7ab774dacc9cccd6995f42))
* Update OpenTelemetry SDK setup ([#568](https://github.com/gentrace/gentrace-node/issues/568)) ([ef51abd](https://github.com/gentrace/gentrace-node/commit/ef51abde3a637c6e5517d221042a3a021519d922))
* Update README.md ([86a8888](https://github.com/gentrace/gentrace-node/commit/86a8888d6f024f8060d96c99fe625935f51eb7ae))

## 0.10.0 (2025-07-15)

Full Changelog: [v0.9.0...v0.10.0](https://github.com/gentrace/gentrace-node/compare/v0.9.0...v0.10.0)

### Features

* **eval-dataset:** support plain array as dataset ([#606](https://github.com/gentrace/gentrace-node/issues/606)) ([698e56b](https://github.com/gentrace/gentrace-node/commit/698e56baa051ae2e5d39cb6afb58e4ff5ba5c33c))

## 0.9.0 (2025-07-08)

Full Changelog: [v0.8.0...v0.9.0](https://github.com/gentrace/gentrace-node/compare/v0.8.0...v0.9.0)

### Features

* Add max concurrency ([#604](https://github.com/gentrace/gentrace-node/issues/604)) ([50dd43b](https://github.com/gentrace/gentrace-node/commit/50dd43bfa828ea89bec110433366afe4ea6737d2))
* Add OpenAI AI SDK and Responses API examples ([#601](https://github.com/gentrace/gentrace-node/issues/601)) ([cbb4d0d](https://github.com/gentrace/gentrace-node/commit/cbb4d0ddfbfac232243563580d4d2081f28ae1c6))
* Add pipeline ID validation and error handling ([#596](https://github.com/gentrace/gentrace-node/issues/596)) ([92ae076](https://github.com/gentrace/gentrace-node/commit/92ae076c69dd9b7fa8e25569d4c3f1f08b5227bb))


### Chores

* improve docs ([#602](https://github.com/gentrace/gentrace-node/issues/602)) ([1bec8ed](https://github.com/gentrace/gentrace-node/commit/1bec8ed45958fc36f42972df82c2d86a2faeb9ef))

## 0.8.0 (2025-07-07)

Full Changelog: [v0.7.0...v0.8.0](https://github.com/gentrace/gentrace-node/compare/v0.7.0...v0.8.0)

### Features

* Update anthropic model to 'claude-opus-4-20250514' ([#600](https://github.com/gentrace/gentrace-node/issues/600)) ([34a8fd3](https://github.com/gentrace/gentrace-node/commit/34a8fd3e7986f730dd4d6d948dbf1a31ad3e4c5a))


### Bug Fixes

* Better error message for OTEL configurations ([#599](https://github.com/gentrace/gentrace-node/issues/599)) ([c7b4a97](https://github.com/gentrace/gentrace-node/commit/c7b4a97a86d53eafcffa8d6e5dbae5dbcb6ace2a))
* Initialize Gentrace if OpenTelemetry not configured in interaction() ([#597](https://github.com/gentrace/gentrace-node/issues/597)) ([1a926da](https://github.com/gentrace/gentrace-node/commit/1a926daa5e3355aa38975645b4c7674277112d6e))
* Update init() to not be async() ([#592](https://github.com/gentrace/gentrace-node/issues/592)) ([17e290b](https://github.com/gentrace/gentrace-node/commit/17e290bce2e8a9641ad67de812c6373beaaeb9ec))


### Chores

* add evaluation dataset example ([#589](https://github.com/gentrace/gentrace-node/issues/589)) ([#589](https://github.com/gentrace/gentrace-node/issues/589)) ([e021576](https://github.com/gentrace/gentrace-node/commit/e021576d556b8ec33637c0c157ebce64f827d85b))

## 0.7.0 (2025-07-02)

Full Changelog: [v0.6.0...v0.7.0](https://github.com/gentrace/gentrace-node/compare/v0.6.0...v0.7.0)

### Features

* Add workflow for publishing PR preview package ([#593](https://github.com/gentrace/gentrace-node/issues/593)) ([95d5101](https://github.com/gentrace/gentrace-node/commit/95d51014ebddc536bd03d9b2d3ec9f230b9dda8f))

## 0.6.0 (2025-07-01)

Full Changelog: [v0.5.0...v0.6.0](https://github.com/gentrace/gentrace-node/compare/v0.5.0...v0.6.0)

### Features

* Add GenAI Semantic Conventions example code ([#590](https://github.com/gentrace/gentrace-node/issues/590)) ([eee6e84](https://github.com/gentrace/gentrace-node/commit/eee6e84a2c9182de7e42c2cfebd7fef7bc204b13))

## 0.5.0 (2025-06-30)

Full Changelog: [v0.4.2...v0.5.0](https://github.com/gentrace/gentrace-node/compare/v0.4.2...v0.5.0)

### Features

* Add more exports to 'init' module ([#588](https://github.com/gentrace/gentrace-node/issues/588)) ([4bc24a8](https://github.com/gentrace/gentrace-node/commit/4bc24a8e6479818a9a937bc007d9607843e895e5))


### Bug Fixes

* Add await keyword before init function calls ([#586](https://github.com/gentrace/gentrace-node/issues/586)) ([37de686](https://github.com/gentrace/gentrace-node/commit/37de6865ba959d5f2c0cf4959e76add8ac90d208))

## 0.4.2 (2025-06-24)

Full Changelog: [v0.4.1...v0.4.2](https://github.com/gentrace/gentrace-node/compare/v0.4.1...v0.4.2)

### Bug Fixes

* Make `init()` return a Promise ([#584](https://github.com/gentrace/gentrace-node/issues/584)) ([fa30fd9](https://github.com/gentrace/gentrace-node/commit/fa30fd92725ce24abbd9cd9d07090b19f5fed5eb))

## 0.4.1 (2025-06-24)

Full Changelog: [v0.4.0...v0.4.1](https://github.com/gentrace/gentrace-node/compare/v0.4.0...v0.4.1)

### Bug Fixes

* Adjust concurrency limit for OTLPExporter, assorted refinements + bugs ([#583](https://github.com/gentrace/gentrace-node/issues/583)) ([3011610](https://github.com/gentrace/gentrace-node/commit/3011610ad03cd38f0fde27c16ac1ff4409bed95f))
* Deeply simplify the examples ([#581](https://github.com/gentrace/gentrace-node/issues/581)) ([f279ce2](https://github.com/gentrace/gentrace-node/commit/f279ce209ec374f40d6f21def55d8d7e08bffb3c))

## 0.4.0 (2025-06-19)

Full Changelog: [v0.3.2...v0.4.0](https://github.com/gentrace/gentrace-node/compare/v0.3.2...v0.4.0)

### Features

* Add `setup()` function for OpenTelemetry wrapper ([#579](https://github.com/gentrace/gentrace-node/issues/579)) ([44e2265](https://github.com/gentrace/gentrace-node/commit/44e2265fc48c11768526f9d5b6faad0da932357b))

## 0.3.2 (2025-06-16)

Full Changelog: [v0.3.1...v0.3.2](https://github.com/gentrace/gentrace-node/compare/v0.3.1...v0.3.2)

## 0.3.1 (2025-06-15)

Full Changelog: [v0.3.0...v0.3.1](https://github.com/gentrace/gentrace-node/compare/v0.3.0...v0.3.1)

### Bug Fixes

* Update OTLPTraceExporter URL ([#576](https://github.com/gentrace/gentrace-node/issues/576)) ([4253402](https://github.com/gentrace/gentrace-node/commit/4253402967b0d5d7fbb6b9169acf531ac6dc9842))

## 0.3.0 (2025-06-10)

Full Changelog: [v0.2.0...v0.3.0](https://github.com/gentrace/gentrace-node/compare/v0.2.0...v0.3.0)

### Features

* add baggage support to eval methods ([#569](https://github.com/gentrace/gentrace-node/issues/569)) ([#569](https://github.com/gentrace/gentrace-node/issues/569)) ([95564ba](https://github.com/gentrace/gentrace-node/commit/95564ba9aa3fd912e9e6727bda451f0dc87ef4ce))


### Bug Fixes

* compat with more runtimes ([53adc04](https://github.com/gentrace/gentrace-node/commit/53adc04423b01cb8f29881731fc4361c6929c58e))


### Chores

* Add console log for OTEL SDK setup ([#570](https://github.com/gentrace/gentrace-node/issues/570)) ([8662f5f](https://github.com/gentrace/gentrace-node/commit/8662f5f6f1db2750a5edd872713c99b31d0adb0c))
* Add Mastra example ([#573](https://github.com/gentrace/gentrace-node/issues/573)) ([dd0844f](https://github.com/gentrace/gentrace-node/commit/dd0844f0e8664e914e404a105b3750e1e02e8fe5))
* Add OpenTelemetry configuration warning function ([#575](https://github.com/gentrace/gentrace-node/issues/575)) ([634a5c1](https://github.com/gentrace/gentrace-node/commit/634a5c1f0a3063c9074d76d7914182b62340f538))
* adjust eslint.config.mjs ignore pattern ([b577e62](https://github.com/gentrace/gentrace-node/commit/b577e6294082a2adf9a9b3d9c1442f7e7be0a97d))
* **deps:** bump eslint-plugin-prettier ([28241ea](https://github.com/gentrace/gentrace-node/commit/28241ea7404e0fafb0547f8cc4d13f8f64a23bdd))
* **internal:** update jest config ([3e5f722](https://github.com/gentrace/gentrace-node/commit/3e5f7225037ab5e82ffcf7557854222830e65ea9))

## 0.2.0 (2025-05-28)

Full Changelog: [v0.1.0...v0.2.0](https://github.com/gentrace/gentrace-node/compare/v0.1.0...v0.2.0)

### Features

* Add ASCII visualizations for OpenTelemetry information flow ([#562](https://github.com/gentrace/gentrace-node/issues/562)) ([bfffd60](https://github.com/gentrace/gentrace-node/commit/bfffd6072b39f95bc57ac8c064319718fdb084a8))
* Add Claude Assistant GitHub Action workflow ([#558](https://github.com/gentrace/gentrace-node/issues/558)) ([952c9dd](https://github.com/gentrace/gentrace-node/commit/952c9dde4a94154df3e8cdcb409176c1a8716a5a))
* add PR title validation workflow ([#554](https://github.com/gentrace/gentrace-node/issues/554)) ([fb8636d](https://github.com/gentrace/gentrace-node/commit/fb8636de562ec218164de77dfff3cd24111c9abb))
* add release type to PR title validation ([#567](https://github.com/gentrace/gentrace-node/issues/567)) ([9404fb9](https://github.com/gentrace/gentrace-node/commit/9404fb92c2fe56944a52619166265ac8c4e116f3))


### Bug Fixes

* Refactor attributes into constants ([#550](https://github.com/gentrace/gentrace-node/issues/550)) ([6a7e8d4](https://github.com/gentrace/gentrace-node/commit/6a7e8d41cace89a59691b26ee17e112b69152a43))
* update Jest config to transform yoctocolors package ([5a0323b](https://github.com/gentrace/gentrace-node/commit/5a0323b2f137afd678fb1b0fbaf07fdfe914b2a4))


### Chores

* Add interaction name for simplicity ([#551](https://github.com/gentrace/gentrace-node/issues/551)) ([a866e5a](https://github.com/gentrace/gentrace-node/commit/a866e5a038c786a8619ff91438e42c98daa3e4e6))
* Detail `traced()` in the docs ([#552](https://github.com/gentrace/gentrace-node/issues/552)) ([3bf57ca](https://github.com/gentrace/gentrace-node/commit/3bf57ca0072778c9f14c7eabdbcbfed53b8dca5b))
* **docs:** grammar improvements ([09c4cff](https://github.com/gentrace/gentrace-node/commit/09c4cff16edc9495ca2320c4440f8d413116e420))
* improve publish-npm script --latest tag logic ([31956fe](https://github.com/gentrace/gentrace-node/commit/31956fec02eda630db73bfedf2556f55ad6f86f4))
* Remove test_case_name attribute ([#548](https://github.com/gentrace/gentrace-node/issues/548)) ([29d01e7](https://github.com/gentrace/gentrace-node/commit/29d01e7d89d568014b524a8502a531cad9ed7a97))
* Rename to evalOnce() and evalDataset() ([#549](https://github.com/gentrace/gentrace-node/issues/549)) ([8301950](https://github.com/gentrace/gentrace-node/commit/8301950c4219c6b70f7ab774dacc9cccd6995f42))
* Update README.md ([86a8888](https://github.com/gentrace/gentrace-node/commit/86a8888d6f024f8060d96c99fe625935f51eb7ae))

## 0.1.0 (2025-05-16)

Full Changelog: [v0.1.0-alpha.8...v0.1.0](https://github.com/gentrace/gentrace-node/compare/v0.1.0-alpha.8...v0.1.0)

### Features

* **api:** Change to API key from Bearer Token ([fea116e](https://github.com/gentrace/gentrace-node/commit/fea116e7d782ed4b8113a9ab5d7750a5ff80d8a7))


### Bug Fixes

* **client:** always overwrite when merging headers ([e599191](https://github.com/gentrace/gentrace-node/commit/e599191cedc71307bd3b7319025cbffac7cbcf17))


### Chores

* **package:** remove engines ([33c6d59](https://github.com/gentrace/gentrace-node/commit/33c6d59f64292dd88cd435cc9e746b2400f2cae4))

## 0.1.0-alpha.8 (2025-05-15)

Full Changelog: [v0.1.0-alpha.7...v0.1.0-alpha.8](https://github.com/gentrace/gentrace-node/compare/v0.1.0-alpha.7...v0.1.0-alpha.8)

### Features

* **client:** add withOptions helper ([9b55917](https://github.com/gentrace/gentrace-node/commit/9b559173d566fbdcbf350175cd8fb02fd62a7e5c))


### Chores

* **client:** drop support for EOL node versions ([18dd728](https://github.com/gentrace/gentrace-node/commit/18dd72880f70dacc36f9334f3efcf7f59b02c871))
* **internal:** codegen related update ([7484d25](https://github.com/gentrace/gentrace-node/commit/7484d2564c3ad9502d4ed3938954be6e97c6782c))
* **internal:** share typescript helpers ([441134d](https://github.com/gentrace/gentrace-node/commit/441134d647b78eb8b53b4d8c26020fe0bc2475e1))
* Temporarily disable test ([#546](https://github.com/gentrace/gentrace-node/issues/546)) ([5ed73b7](https://github.com/gentrace/gentrace-node/commit/5ed73b721d49d34584d5de539ac66c28b72f349f))


### Documentation

* add examples to tsdocs ([5c37a0a](https://github.com/gentrace/gentrace-node/commit/5c37a0a80562c13e4cf7ef6c2d82d40d64f72cef))
* **readme:** fix typo ([2408615](https://github.com/gentrace/gentrace-node/commit/2408615763781b6dac173af84136cb77fb16975a))

## 0.1.0-alpha.7 (2025-05-08)

Full Changelog: [v0.1.0-alpha.6...v0.1.0-alpha.7](https://github.com/gentrace/gentrace-node/compare/v0.1.0-alpha.6...v0.1.0-alpha.7)

### Features

* Introduce GentraceSampler and GentraceSpanProcessor ([#543](https://github.com/gentrace/gentrace-node/issues/543)) ([30e1f7d](https://github.com/gentrace/gentrace-node/commit/30e1f7de7826fb9d9ef185537fe40df3462fdc17))


### Bug Fixes

* Add `Baggage` to the interaction to `gentrace.sample` ([#542](https://github.com/gentrace/gentrace-node/issues/542)) ([2b58351](https://github.com/gentrace/gentrace-node/commit/2b58351cc28aad5f4a50d19c9da4660f6e6198fc))

## 0.1.0-alpha.6 (2025-04-30)

Full Changelog: [v0.1.0-alpha.5...v0.1.0-alpha.6](https://github.com/gentrace/gentrace-node/compare/v0.1.0-alpha.5...v0.1.0-alpha.6)

### Features

* Add 'traced' export in lib/index.ts ([#540](https://github.com/gentrace/gentrace-node/issues/540)) ([25bbcfc](https://github.com/gentrace/gentrace-node/commit/25bbcfc1d365fbfca15dfe4f6f6b517357d1e3f4))

## 0.1.0-alpha.5 (2025-04-30)

Full Changelog: [v0.1.0-alpha.4...v0.1.0-alpha.5](https://github.com/gentrace/gentrace-node/compare/v0.1.0-alpha.4...v0.1.0-alpha.5)

### Features

* Add traced function with OpenTelemetry tracing ([#537](https://github.com/gentrace/gentrace-node/issues/537)) ([74fa9e1](https://github.com/gentrace/gentrace-node/commit/74fa9e1a2f463ed2ed2c6a0e48cab86f3517a042))


### Bug Fixes

* Widen OTEL version range ([#536](https://github.com/gentrace/gentrace-node/issues/536)) ([64cdf97](https://github.com/gentrace/gentrace-node/commit/64cdf97f1b3d04e26e9cb883a4f16940cc4488d0))


### Chores

* **internal:** refactor utils ([03ce710](https://github.com/gentrace/gentrace-node/commit/03ce710b80849f81da2a0fe23b4863ad3de46688))

## 0.1.0-alpha.4 (2025-04-28)

Full Changelog: [v0.1.0-alpha.3...v0.1.0-alpha.4](https://github.com/gentrace/gentrace-node/compare/v0.1.0-alpha.3...v0.1.0-alpha.4)

### Features

* **api:** api update ([1513ba3](https://github.com/gentrace/gentrace-node/commit/1513ba3fa3d38b780e2a798ab04ecfbe0719e9ac))

## 0.1.0-alpha.3 (2025-04-24)

Full Changelog: [v0.1.0-alpha.2...v0.1.0-alpha.3](https://github.com/gentrace/gentrace-node/compare/v0.1.0-alpha.2...v0.1.0-alpha.3)

### Features

* fix: Update package manager instructions in README ([#533](https://github.com/gentrace/gentrace-node/issues/533)) ([b644e91](https://github.com/gentrace/gentrace-node/commit/b644e91f1d81ff113229d4c0759a081b02da4a88))


### Chores

* update SDK settings ([7188003](https://github.com/gentrace/gentrace-node/commit/718800361ebe43f304dc38e850447ec4385638d8))

## 0.1.0-alpha.2 (2025-04-24)

Full Changelog: [v0.1.0-alpha.1...v0.1.0-alpha.2](https://github.com/gentrace/gentrace-node/compare/v0.1.0-alpha.1...v0.1.0-alpha.2)

### Features

* feat: Introduce API/SDK observability wrappers ([#529](https://github.com/gentrace/gentrace-node/issues/529)) ([ae4c6b6](https://github.com/gentrace/gentrace-node/commit/ae4c6b6595c2b465ca84c0a57e1f4fb6a0fb14e0))


### Chores

* **ci:** add timeout thresholds for CI jobs ([7c67bc1](https://github.com/gentrace/gentrace-node/commit/7c67bc14880dd1ca9cb8b12be91ae58b2618dc81))
* **ci:** only use depot for staging repos ([8a29273](https://github.com/gentrace/gentrace-node/commit/8a29273249f12d0793b1c6040f4e8ee5d4798344))
* **internal:** codegen related update ([5f143ff](https://github.com/gentrace/gentrace-node/commit/5f143ff14952a7453baa7cd440922bd7e05b2c93))
* **perf:** faster base64 decoding ([4c08cfa](https://github.com/gentrace/gentrace-node/commit/4c08cfa4d949800245bf17456c2bb6d2cff589ef))

## 0.1.0-alpha.1 (2025-04-21)

Full Changelog: [v0.0.1-alpha.0...v0.1.0-alpha.1](https://github.com/gentrace/gentrace-node/compare/v0.0.1-alpha.0...v0.1.0-alpha.1)

### Features

* **api:** update via SDK Studio ([a42de37](https://github.com/gentrace/gentrace-node/commit/a42de37621443ce59528da62d266df85ca1889bf))
* **api:** update via SDK Studio ([9127830](https://github.com/gentrace/gentrace-node/commit/91278304bf66dc87eee8b87df7d8f9b7a4a53256))
* **api:** update via SDK Studio ([a9fb64a](https://github.com/gentrace/gentrace-node/commit/a9fb64a921623275ba39b0736c6b34c071b97f1b))
* **api:** update via SDK Studio ([96e490d](https://github.com/gentrace/gentrace-node/commit/96e490daf5aa2b001a51d7c356f73c015278bedc))
* **api:** update via SDK Studio ([524c3a2](https://github.com/gentrace/gentrace-node/commit/524c3a24422e55ac1b6b6b449500228ec180a33e))
* **api:** update via SDK Studio ([9a8e00c](https://github.com/gentrace/gentrace-node/commit/9a8e00c1ca0aebe6b5d1c2d7677be284d6cc4cd8))
* **api:** update via SDK Studio ([fd602e8](https://github.com/gentrace/gentrace-node/commit/fd602e88d73c45c5ecec10e2bd8dcaaf50b2961f))
* **api:** update via SDK Studio ([8318283](https://github.com/gentrace/gentrace-node/commit/83182836ed3bb183eefde8cc0f51333708452ce2))
* **api:** update via SDK Studio ([3631f84](https://github.com/gentrace/gentrace-node/commit/3631f844d3a45dbc38983cad73d28ce4bae8a660))
* **api:** update via SDK Studio ([63fbbe0](https://github.com/gentrace/gentrace-node/commit/63fbbe059f1a5aadd6d9d7834bfc3b8e64956cce))
* **api:** update via SDK Studio ([89ff1af](https://github.com/gentrace/gentrace-node/commit/89ff1afc0b775083fb16b05a989a5b1ca55332c4))
* **api:** update via SDK Studio ([20a06bb](https://github.com/gentrace/gentrace-node/commit/20a06bbca789b9b0752164a992794985bcef8651))
* **api:** update via SDK Studio ([3700774](https://github.com/gentrace/gentrace-node/commit/3700774dac73eec3746027f37240f0c9ddcf8833))
* **api:** update via SDK Studio ([02eb59d](https://github.com/gentrace/gentrace-node/commit/02eb59da38b92bff067811f684e7c87a76b6530a))
* **api:** update via SDK Studio ([83719ca](https://github.com/gentrace/gentrace-node/commit/83719ca53638644066dd834baddd3582aed6135f))
* **api:** update via SDK Studio ([85a5c27](https://github.com/gentrace/gentrace-node/commit/85a5c27ca8d127d88468c8824047236f789e030d))
* **api:** update via SDK Studio ([7e59ac5](https://github.com/gentrace/gentrace-node/commit/7e59ac52e9798ec50b2bb34a37e6230d8b2a42cf))
* **api:** update via SDK Studio ([aadc855](https://github.com/gentrace/gentrace-node/commit/aadc855b69e61f47753be467e9efed5adb8b7a83))
* **api:** update via SDK Studio ([61a5397](https://github.com/gentrace/gentrace-node/commit/61a5397401f7e099edd3408950df6224221c0bdb))
* **api:** update via SDK Studio ([906ace6](https://github.com/gentrace/gentrace-node/commit/906ace6cb963202d633b31e216abd66d902125e1))


### Bug Fixes

* **api:** improve type resolution when importing as a package ([#524](https://github.com/gentrace/gentrace-node/issues/524)) ([2e5b5e3](https://github.com/gentrace/gentrace-node/commit/2e5b5e322fe200517e11afbc0008406f4822f815))
* **client:** send all configured auth headers ([#527](https://github.com/gentrace/gentrace-node/issues/527)) ([25ac75d](https://github.com/gentrace/gentrace-node/commit/25ac75dd865e4516bb973ea1976e39818b61e3fd))
* **internal:** fix file uploads in node 18 jest ([89fa095](https://github.com/gentrace/gentrace-node/commit/89fa09514a0c91aa1d52b847a0020612c37d172d))
* **mcp:** remove unused tools.ts ([#525](https://github.com/gentrace/gentrace-node/issues/525)) ([41254e9](https://github.com/gentrace/gentrace-node/commit/41254e98773bbbb8d1154f285c86df75375312e2))


### Chores

* **client:** minor internal fixes ([1d37551](https://github.com/gentrace/gentrace-node/commit/1d37551385bc41aaa9eaea794ea699f878bb1071))
* go live ([75905df](https://github.com/gentrace/gentrace-node/commit/75905df2cbc38f015a252a22bdc8cd6eaddfdca6))
* go live ([#522](https://github.com/gentrace/gentrace-node/issues/522)) ([22c7b0b](https://github.com/gentrace/gentrace-node/commit/22c7b0b446b67024230dadc7868233489fe9ff12))
* **internal:** improve node 18 shims ([7fc2582](https://github.com/gentrace/gentrace-node/commit/7fc2582f3141d3b21b561fa150c3fbc9de6f4e83))
* **internal:** reduce CI branch coverage ([cdf9a39](https://github.com/gentrace/gentrace-node/commit/cdf9a396b7c86bf83f3daca29b7cecbdcb227148))
* **internal:** upload builds and expand CI branch coverage ([be1e122](https://github.com/gentrace/gentrace-node/commit/be1e1229d309dd88758dec75e4f893bef53df22b))
* **tests:** improve enum examples ([#528](https://github.com/gentrace/gentrace-node/issues/528)) ([94d7f5c](https://github.com/gentrace/gentrace-node/commit/94d7f5c5fe48df075c4c16bc4d3b0f6a5effa940))


### Documentation

* swap examples used in readme ([#526](https://github.com/gentrace/gentrace-node/issues/526)) ([4a6a323](https://github.com/gentrace/gentrace-node/commit/4a6a3232437bc2f40f59ef5788d62fc5841ffa17))
