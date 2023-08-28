# Changelog

## [0.15.9](https://github.com/gentrace/gentrace-node/compare/v0.15.8...v0.15.9) (2023-08-28)


### Bug Fixes

* Fix cases not accepting slug ([#203](https://github.com/gentrace/gentrace-node/issues/203)) ([c1fcaae](https://github.com/gentrace/gentrace-node/commit/c1fcaae5b54b0e8ed8cc5efd3c25fb7fd335a716))

## [0.15.8](https://github.com/gentrace/gentrace-node/compare/v0.15.7...v0.15.8) (2023-08-28)


### Bug Fixes

* Fix slug not accepted in testSubmitResult ([#201](https://github.com/gentrace/gentrace-node/issues/201)) ([c3d6902](https://github.com/gentrace/gentrace-node/commit/c3d690271f7eec5d8673d001aae86ba4d98857de))

## [0.15.7](https://github.com/gentrace/gentrace-node/compare/v0.15.6...v0.15.7) (2023-08-28)


### Bug Fixes

* Fix not passing inputs and templates for chat completion ([#197](https://github.com/gentrace/gentrace-node/issues/197)) ([cb63fc6](https://github.com/gentrace/gentrace-node/commit/cb63fc6e33e9b552cc4a7d15716ced324970e07d))

## [0.15.6](https://github.com/gentrace/gentrace-node/compare/v0.15.5...v0.15.6) (2023-08-18)


### Bug Fixes

* Handle simple OpenAI streaming usage case ([#179](https://github.com/gentrace/gentrace-node/issues/179)) ([0cb95a3](https://github.com/gentrace/gentrace-node/commit/0cb95a304685005eb8773060ee9ce00a751ba775))

## [0.15.5](https://github.com/gentrace/gentrace-node/compare/v0.15.4...v0.15.5) (2023-08-18)


### Bug Fixes

* Fix end and start streaming times not properly reflecting ([#177](https://github.com/gentrace/gentrace-node/issues/177)) ([01fdb55](https://github.com/gentrace/gentrace-node/commit/01fdb553d5eb3a058502e20b889995f3444d0f99))

## [0.15.4](https://github.com/gentrace/gentrace-node/compare/v0.15.3...v0.15.4) (2023-08-18)


### Bug Fixes

* Fix streaming when using OpenAI workaround ([#175](https://github.com/gentrace/gentrace-node/issues/175)) ([ecdb54f](https://github.com/gentrace/gentrace-node/commit/ecdb54fa71aab6b4bb5e1888ceddcafad6abae01))

## [0.15.3](https://github.com/gentrace/gentrace-node/compare/v0.15.2...v0.15.3) (2023-08-18)


### Bug Fixes

* Add support for edge environments ([#170](https://github.com/gentrace/gentrace-node/issues/170)) ([c00ed18](https://github.com/gentrace/gentrace-node/commit/c00ed18fe2c4cb9c9043f8d024eb32e77e6d7594))
* Aggregate the stream response for chat completion and completion ([#174](https://github.com/gentrace/gentrace-node/issues/174)) ([aa1d7b5](https://github.com/gentrace/gentrace-node/commit/aa1d7b50ab230772ffd108c5666c2b0f119c2a30))

## [0.15.2](https://github.com/gentrace/gentrace-node/compare/v0.15.1...v0.15.2) (2023-07-31)


### Bug Fixes

* Add collection method ([#163](https://github.com/gentrace/gentrace-node/issues/163)) ([c954403](https://github.com/gentrace/gentrace-node/commit/c954403b39620dd7ff772026c4fa96f0d369d592))
* Add refining test ([#167](https://github.com/gentrace/gentrace-node/issues/167)) ([7178eab](https://github.com/gentrace/gentrace-node/commit/7178eabb33ed5ab67e63606b7e0f3db5f8415df6))
* Add test for collectionType   ([#165](https://github.com/gentrace/gentrace-node/issues/165)) ([39f1d1e](https://github.com/gentrace/gentrace-node/commit/39f1d1e6e962b5cee93db38069b6818ff5808860))
* Add test run counter ([#166](https://github.com/gentrace/gentrace-node/issues/166)) ([9f73c6f](https://github.com/gentrace/gentrace-node/commit/9f73c6f70ce98566570c4177664a19e00eb32fc6))

## [0.15.1](https://github.com/gentrace/gentrace-node/compare/v0.15.0...v0.15.1) (2023-07-27)


### Bug Fixes

* Make sure Pipeline throws if init() was not called ([#161](https://github.com/gentrace/gentrace-node/issues/161)) ([f8703ef](https://github.com/gentrace/gentrace-node/commit/f8703ef74f38023ce7e6c6f65ee47f295090d363))

## [0.15.0](https://github.com/gentrace/gentrace-node/compare/v0.14.0...v0.15.0) (2023-07-26)


### Features

* Merge evaluate and observe ([#158](https://github.com/gentrace/gentrace-node/issues/158)) ([529b26c](https://github.com/gentrace/gentrace-node/commit/529b26c4d41690bb6543a9c2ec711c98e66005b4))

## [0.14.0](https://github.com/gentrace/gentrace-node/compare/v0.13.0...v0.14.0) (2023-07-20)


### Features

* when ingesting test runs, support outputs (a JSON blob) and deprecate output / outputSteps  ([#155](https://github.com/gentrace/gentrace-node/issues/155)) ([e04e3bc](https://github.com/gentrace/gentrace-node/commit/e04e3bcd780fd4a4493cd31379bf361c0006e921))

## [0.13.0](https://github.com/gentrace/gentrace-node/compare/v0.12.0...v0.13.0) (2023-07-18)


### Features

* Accept output steps ([#151](https://github.com/gentrace/gentrace-node/issues/151)) ([a5f9c42](https://github.com/gentrace/gentrace-node/commit/a5f9c425b552807f4666de412c08c6c3849ee678))
* Add TestSet routes with label filtering ([#153](https://github.com/gentrace/gentrace-node/issues/153)) ([1c16e6f](https://github.com/gentrace/gentrace-node/commit/1c16e6fcdd19b793d64845c66260806a682c56d4))

## [0.12.0](https://github.com/gentrace/gentrace-node/compare/v0.11.1...v0.12.0) (2023-06-17)


### Features

* Add TestRun name ([#147](https://github.com/gentrace/gentrace-node/issues/147)) ([9ebc6e4](https://github.com/gentrace/gentrace-node/commit/9ebc6e4a8768b560f3bfc9f0aa91758d17c7322b))

## [0.11.1](https://github.com/gentrace/gentrace-node/compare/v0.11.0...v0.11.1) (2023-06-15)


### Bug Fixes

* Add `GENTRACE_API_KEY` as an optional env variable ([#143](https://github.com/gentrace/gentrace-node/issues/143)) ([d104b41](https://github.com/gentrace/gentrace-node/commit/d104b411416862bfc95f8cac4e2f9e132799d7fa))

## [0.11.0](https://github.com/gentrace/gentrace-node/compare/v0.10.0...v0.11.0) (2023-06-15)


### Features

* Ensure that `GENTRACE_BRANCH` and `GENTRACE_COMMIT` are used ([#141](https://github.com/gentrace/gentrace-node/issues/141)) ([b7f10dd](https://github.com/gentrace/gentrace-node/commit/b7f10ddf45463d518665ee55a936f65f5d9e088e))

## [0.10.0](https://github.com/gentrace/gentrace-node/compare/v0.9.2...v0.10.0) (2023-06-15)


### Features

* Simplify the SDK for evaluation endpoints ([#138](https://github.com/gentrace/gentrace-node/issues/138)) ([635538c](https://github.com/gentrace/gentrace-node/commit/635538c75ce58b0075a82f41e0965afe60621d07))


### Bug Fixes

* Clarify the recommendation to use submitTestResults() ([#140](https://github.com/gentrace/gentrace-node/issues/140)) ([a9dde74](https://github.com/gentrace/gentrace-node/commit/a9dde74848cde7d2c47d311cf7b95a514004d7ee))

## [0.9.2](https://github.com/gentrace/gentrace-node/compare/v0.9.1...v0.9.2) (2023-06-05)


### Bug Fixes

* actually pass through the branch and commit ([#133](https://github.com/gentrace/gentrace-node/issues/133)) ([3dfb5c5](https://github.com/gentrace/gentrace-node/commit/3dfb5c55b42204012a04d2da554014b36832d003))

## [0.9.1](https://github.com/gentrace/gentrace-node/compare/v0.9.0...v0.9.1) (2023-06-05)


### Bug Fixes

* remove source, correct tests ([#131](https://github.com/gentrace/gentrace-node/issues/131)) ([67d3b64](https://github.com/gentrace/gentrace-node/commit/67d3b64ae379da2ebea818de3fe64c604a62f1ca))

## [0.9.0](https://github.com/gentrace/gentrace-node/compare/v0.8.1...v0.9.0) (2023-06-05)


### Features

* change interface to include init() function for auth ([#128](https://github.com/gentrace/gentrace-node/issues/128)) ([7a08eab](https://github.com/gentrace/gentrace-node/commit/7a08eab1dbbefe99b6527669678eb88b99392fd1))

## [0.8.1](https://github.com/gentrace/gentrace-node/compare/v0.8.0...v0.8.1) (2023-06-01)


### Bug Fixes

* add expected and archive ([#125](https://github.com/gentrace/gentrace-node/issues/125)) ([edf6579](https://github.com/gentrace/gentrace-node/commit/edf65790c5b11a8ebf238de05af9412694a86bdc))

## [0.8.0](https://github.com/gentrace/gentrace-node/compare/v0.7.23...v0.8.0) (2023-05-31)


### Features

* add evaluation routes ([#120](https://github.com/gentrace/gentrace-node/issues/120)) ([6b4109b](https://github.com/gentrace/gentrace-node/commit/6b4109b33c752b8d3a7378c77413b0a4cf3f1774))

## [0.7.23](https://github.com/gentrace/gentrace-node/compare/v0.7.22...v0.7.23) (2023-05-12)


### Bug Fixes

* add explicit performance import ([#119](https://github.com/gentrace/gentrace-node/issues/119)) ([78850ec](https://github.com/gentrace/gentrace-node/commit/78850ec8c1307615a9489c630a764b745d66ab3b))


### Miscellaneous Chores

* release 0.7.23 ([#117](https://github.com/gentrace/gentrace-node/issues/117)) ([07017f0](https://github.com/gentrace/gentrace-node/commit/07017f02d0044b0d940783e3ccb985f2020ca201))

## [0.7.22](https://github.com/gentrace/gentrace-node/compare/v0.7.21...v0.7.22) (2023-05-11)


### Bug Fixes

* allow ES module interop ([#115](https://github.com/gentrace/gentrace-node/issues/115)) ([e835ca8](https://github.com/gentrace/gentrace-node/commit/e835ca87a527f69644d90edbe767e586a3a9afd3))

## [0.7.21](https://github.com/gentrace/gentrace-node/compare/v0.7.19...v0.7.21) (2023-05-11)


### Miscellaneous Chores

* release 0.7.21 ([#113](https://github.com/gentrace/gentrace-node/issues/113)) ([19487c0](https://github.com/gentrace/gentrace-node/commit/19487c0c923343f409f1e743849b4075cf7779a1))
* release 0.7.4 ([#112](https://github.com/gentrace/gentrace-node/issues/112)) ([9eb3df8](https://github.com/gentrace/gentrace-node/commit/9eb3df8ec2cbadb3bd41e6e7d76257f0e4967458))

## [0.7.18](https://github.com/gentrace/gentrace-node/compare/v0.7.17...v0.7.18) (2023-05-09)


### Bug Fixes

* change dep location ([#107](https://github.com/gentrace/gentrace-node/issues/107)) ([540315b](https://github.com/gentrace/gentrace-node/commit/540315b689a4c6a960ff2d7db58e1012dc6f0b50))

## [0.7.17](https://github.com/gentrace/gentrace-node/compare/v0.7.16...v0.7.17) (2023-05-09)


### Bug Fixes

* ensure CJS dependencies are properly converted ([#105](https://github.com/gentrace/gentrace-node/issues/105)) ([bac590c](https://github.com/gentrace/gentrace-node/commit/bac590c0f1bdde67c4e1bbb69ffb13be4ef771ba))

## [0.7.16](https://github.com/gentrace/gentrace-node/compare/v0.7.15...v0.7.16) (2023-05-09)


### Bug Fixes

* add tslib and see if dependencies resolve correctly ([#103](https://github.com/gentrace/gentrace-node/issues/103)) ([96a9299](https://github.com/gentrace/gentrace-node/commit/96a92991c85fc0ee7dc8f307943f197045f1640a))

## [0.7.15](https://github.com/gentrace/gentrace-node/compare/v0.7.14...v0.7.15) (2023-05-09)


### Bug Fixes

* simplify the package structure to allow better reuse ([#99](https://github.com/gentrace/gentrace-node/issues/99)) ([6ed7ee1](https://github.com/gentrace/gentrace-node/commit/6ed7ee1d1a942266be6719e1cc53fbbb5935968d))

## [0.7.14](https://github.com/gentrace/gentrace-node/compare/v0.7.13...v0.7.14) (2023-05-06)


### Bug Fixes

* pipeline not passed in correctly ([#97](https://github.com/gentrace/gentrace-node/issues/97)) ([35ce52d](https://github.com/gentrace/gentrace-node/commit/35ce52d5d0a0cde5fafbc3129b163cd29e2e2a77))

## [0.7.13](https://github.com/gentrace/gentrace-node/compare/v0.7.12...v0.7.13) (2023-05-06)


### Bug Fixes

* make sure that package.json includes main and types ([#95](https://github.com/gentrace/gentrace-node/issues/95)) ([165712b](https://github.com/gentrace/gentrace-node/commit/165712bf429b8c6d0d2708519584e582dedaea09))

## [0.7.12](https://github.com/gentrace/gentrace-node/compare/v0.7.11...v0.7.12) (2023-05-05)


### Bug Fixes

* remove the this.pipelineRun reference ([#93](https://github.com/gentrace/gentrace-node/issues/93)) ([6097861](https://github.com/gentrace/gentrace-node/commit/6097861532eaa5fefbf8b8f00831ad0ad2118b3d))

## [0.7.11](https://github.com/gentrace/gentrace-node/compare/v0.7.10...v0.7.11) (2023-05-05)


### Bug Fixes

* temporarily duplicate source into openai and pinecone ([#91](https://github.com/gentrace/gentrace-node/issues/91)) ([5b5abab](https://github.com/gentrace/gentrace-node/commit/5b5ababc3e4cf7dfe2ae2b3ae8b37356a34dafad))

## [0.7.10](https://github.com/gentrace/gentrace-node/compare/v0.7.9...v0.7.10) (2023-05-05)


### Bug Fixes

* changed how we process self-contained invocations ([#89](https://github.com/gentrace/gentrace-node/issues/89)) ([860ff8c](https://github.com/gentrace/gentrace-node/commit/860ff8c5f4f56754d57b697e0962c642a7116e71))

## [0.7.9](https://github.com/gentrace/gentrace-node/compare/v0.7.8...v0.7.9) (2023-05-02)


### Bug Fixes

* add in several more usability tests ([#86](https://github.com/gentrace/gentrace-node/issues/86)) ([330e1c4](https://github.com/gentrace/gentrace-node/commit/330e1c4783494e73b948ff0719a996037a26f837))
* add more host validation in configuration, jest init ([#85](https://github.com/gentrace/gentrace-node/issues/85)) ([ca0760c](https://github.com/gentrace/gentrace-node/commit/ca0760c4e0fb9e7f0a5939b81e6ce41e7a9bf28a))

## [0.7.8](https://github.com/gentrace/gentrace-node/compare/v0.7.7...v0.7.8) (2023-05-02)


### Bug Fixes

* add logger object parameter ([#80](https://github.com/gentrace/gentrace-node/issues/80)) ([be0ee61](https://github.com/gentrace/gentrace-node/commit/be0ee61f30df9ece0876b6fc167f1cc76489f896))
* make logger fixes ([#84](https://github.com/gentrace/gentrace-node/issues/84)) ([e1be944](https://github.com/gentrace/gentrace-node/commit/e1be944f6296c90cea6f584ad260136b89db9480))

## [0.7.7](https://github.com/gentrace/gentrace-node/compare/v0.7.6...v0.7.7) (2023-05-01)


### Bug Fixes

* all rendering message templates for chat completion ([#76](https://github.com/gentrace/gentrace-node/issues/76)) ([1ffab36](https://github.com/gentrace/gentrace-node/commit/1ffab362125e6ca01f896ccd5de7c01809aa6172))
* allow prompt for completion ([#74](https://github.com/gentrace/gentrace-node/issues/74)) ([3ca23df](https://github.com/gentrace/gentrace-node/commit/3ca23dfd7f35b278aa400a4ca2604b4825e90778))

## [0.7.6](https://github.com/gentrace/gentrace-node/compare/v0.7.5...v0.7.6) (2023-04-19)


### Bug Fixes

* temporarily remove provenance check ([#67](https://github.com/gentrace/gentrace-node/issues/67)) ([b983b74](https://github.com/gentrace/gentrace-node/commit/b983b74ca8acc261f53ba92179e84ad47af0046f))

## [0.7.5](https://github.com/gentrace/gentrace-node/compare/v0.7.4...v0.7.5) (2023-04-19)


### Miscellaneous Chores

* release 0.7.5  ([#65](https://github.com/gentrace/gentrace-node/issues/65)) ([dcde930](https://github.com/gentrace/gentrace-node/commit/dcde930b23c854d464e45656baa671f69dc5083b))

## [0.7.4](https://github.com/gentrace/gentrace-node/compare/v0.7.2...v0.7.4) (2023-04-19)


### Miscellaneous Chores

* release 0.7.4 ([c124487](https://github.com/gentrace/gentrace-node/commit/c12448729ed4b4ee4bc5eb34c6153ae04a0ab3b1))

## [0.7.2](https://github.com/gentrace/gentrace-node/compare/v0.7.1...v0.7.2) (2023-04-19)


### Miscellaneous Chores

* release 0.7.2 ([#58](https://github.com/gentrace/gentrace-node/issues/58)) ([1f95bfd](https://github.com/gentrace/gentrace-node/commit/1f95bfd2b3d16d6672ce0cb497f75064cd2aab21))

## [0.7.1](https://github.com/gentrace/gentrace-node/compare/v0.7.0...v0.7.1) (2023-04-18)


### Bug Fixes

* ensure that errors are not thrown if pipelineID is not specified ([#52](https://github.com/gentrace/gentrace-node/issues/52)) ([e883ab7](https://github.com/gentrace/gentrace-node/commit/e883ab7f07e97650684d6e4f2851d0d23eda1052))
* make sure that submission is awaited if they specify ([#56](https://github.com/gentrace/gentrace-node/issues/56)) ([96fa7f4](https://github.com/gentrace/gentrace-node/commit/96fa7f4e8de31fa4ee8cb13f6efb8fae6aca5be7))
* polish addStepRun invocation criteria ([#53](https://github.com/gentrace/gentrace-node/issues/53)) ([2e9aa86](https://github.com/gentrace/gentrace-node/commit/2e9aa86a2e4a00794b188c706a549ffb70edd8c4))
* return pipeline run ID back to client, with typing ([#50](https://github.com/gentrace/gentrace-node/issues/50)) ([050a5d1](https://github.com/gentrace/gentrace-node/commit/050a5d12283d93d2d913e94741fa661e01683440))

## [0.7.0](https://github.com/gentrace/gentrace-node/compare/v0.6.0...v0.7.0) (2023-04-18)


### Features

* make the API interface match better ([#48](https://github.com/gentrace/gentrace-node/issues/48)) ([fc77c0b](https://github.com/gentrace/gentrace-node/commit/fc77c0b9c27e767bacc4c34f399082833ec2496a))

## [0.6.0](https://github.com/gentrace/gentrace-node/compare/v0.5.0...v0.6.0) (2023-04-18)


### Features

* improve API interface ([#46](https://github.com/gentrace/gentrace-node/issues/46)) ([7eacd72](https://github.com/gentrace/gentrace-node/commit/7eacd726bc9c9da059e0192d8d29001af1ffcf82))

## [0.5.0](https://github.com/gentrace/gentrace-node/compare/v0.4.0...v0.5.0) (2023-04-18)


### Features

* add in self-contained Pinecone ([#44](https://github.com/gentrace/gentrace-node/issues/44)) ([82b52c3](https://github.com/gentrace/gentrace-node/commit/82b52c3d0565d6fe9b2e35e17e63dfb2dfa1d5cb))

## [0.4.0](https://github.com/gentrace/gentrace-node/compare/v0.3.6...v0.4.0) (2023-04-17)


### Features

* add self-contained PipelineRun invocation for OpenAI methods ([#42](https://github.com/gentrace/gentrace-node/issues/42)) ([a17fa63](https://github.com/gentrace/gentrace-node/commit/a17fa638f102c3ffa221892c58d14443ba11d67d))

## [0.3.6](https://github.com/gentrace/gentrace-node/compare/v0.3.5...v0.3.6) (2023-04-10)


### Bug Fixes

* change references to reflect name change ([472f30f](https://github.com/gentrace/gentrace-node/commit/472f30f9d886320b774d32e22fcf8082cd4d0be8))

## [0.3.5](https://github.com/gentrace/gentrace-node/compare/v0.3.4...v0.3.5) (2023-04-07)


### Bug Fixes

* make sure submit returns Axios data ([edf68a3](https://github.com/gentrace/gentrace-node/commit/edf68a3a68af5a6294bb00e0c0750a495c3bad2c))

## [0.3.4](https://github.com/gentrace/gentrace-node/compare/v0.3.3...v0.3.4) (2023-04-06)


### Bug Fixes

* format fix ([8bfdc45](https://github.com/gentrace/gentrace-node/commit/8bfdc45ebabb9195e76fd1a47a10ab1ad43275c5))

## [0.3.3](https://github.com/gentrace/gentrace-node/compare/v0.3.2...v0.3.3) (2023-04-06)


### Bug Fixes

* simulate a change within the package.json ([232ef8e](https://github.com/gentrace/gentrace-node/commit/232ef8e45e510633c1d0dc04c41bfef47cdb4b52))

## [0.3.2](https://github.com/gentrace/gentrace-node/compare/v0.3.1...v0.3.2) (2023-04-06)


### Miscellaneous Chores

* release 0.3.1 ([abc54ca](https://github.com/gentrace/gentrace-node/commit/abc54ca545aa484f18dc69b22f3c5cdae705e130))
* release 0.3.2 ([1c541ff](https://github.com/gentrace/gentrace-node/commit/1c541ff3e3a57e68cfc7afdb30f0aab6ff33f559))

## [0.3.1](https://github.com/gentrace/gentrace-node/compare/v0.3.1...v0.3.1) (2023-04-06)


### Miscellaneous Chores

* release 0.3.1 ([abc54ca](https://github.com/gentrace/gentrace-node/commit/abc54ca545aa484f18dc69b22f3c5cdae705e130))

## [0.3.1](https://github.com/gentrace/gentrace-node/compare/v0.3.0...v0.3.1) (2023-04-06)


### Bug Fixes

* move CHANGELOG location ([4ccf1fe](https://github.com/gentrace/gentrace-node/commit/4ccf1fe1a0e39db0462961f198d487682e9663db))

## [0.3.0](https://github.com/gentrace/gentrace-node/compare/v0.2.0...v0.3.0) (2023-04-06)


### Features

* add in package.json and extra files to update ([a57057f](https://github.com/gentrace/gentrace-node/commit/a57057f074a54dbc1b0fa4a9793d3b904c229d6a))

## [0.2.0](https://github.com/gentrace/gentrace-node/compare/v0.1.10...v0.2.0) (2023-04-06)


### Features

* restructure directory ([37ac0e1](https://github.com/gentrace/gentrace-node/commit/37ac0e1789a2dc939c411345eafc4a9ff78389ce))


### Bug Fixes

* add changes for workflow publishing ([1cd6722](https://github.com/gentrace/gentrace-node/commit/1cd6722aefe33e15a94ad073df3ff932541e3184))

## [0.1.10](https://github.com/gentrace/gentrace-node/compare/v0.1.9...v0.1.10) (2023-04-06)


### Bug Fixes

* add typings for cloned handler ([cc40770](https://github.com/gentrace/gentrace-node/commit/cc40770c7728c5c5f3c095f6414da1ced0016e94))

## [0.1.9](https://github.com/gentrace/gentrace-node/compare/v0.1.8...v0.1.9) (2023-04-05)


### Bug Fixes

* workflow should trim down node modules, readd as peer dependencies and include range ([f4fc5cd](https://github.com/gentrace/gentrace-node/commit/f4fc5cda0ff3b57606b8a4c574978dae438e83c1))

## [0.1.8](https://github.com/gentrace/gentrace-node/compare/v0.1.7...v0.1.8) (2023-04-05)


### Bug Fixes

* refactor in a slightly hacky way to support maintaining Pinecone config for different pipeline runs ([3995538](https://github.com/gentrace/gentrace-node/commit/399553820dca10089e4aa157122ff6c43a0df33f))

## [0.1.7](https://github.com/gentrace/gentrace-node/compare/v0.1.6...v0.1.7) (2023-04-05)


### Bug Fixes

* add in a few more fixes to correct server incompatibility ([a0aad17](https://github.com/gentrace/gentrace-node/commit/a0aad1751a73263f5d6af9895552900b04588ccd))

## [0.1.6](https://github.com/gentrace/gentrace-node/compare/v0.1.5...v0.1.6) (2023-04-04)


### Bug Fixes

* add in the appropriate package.json changes ([bb6ede3](https://github.com/gentrace/gentrace-node/commit/bb6ede39ba2635b0211d8a842b64ced039cd2c23))
* resolve adding in the previously stashed fixes ([d7a112e](https://github.com/gentrace/gentrace-node/commit/d7a112edf96194dd3fc3bcf97db1e7c4874dcca6))

## [0.1.5](https://github.com/gentrace/gentrace-node/compare/v0.1.4...v0.1.5) (2023-04-04)


### Miscellaneous Chores

* release 0.1.5 ([8ed44fe](https://github.com/gentrace/gentrace-node/commit/8ed44febca7c7f4ca8c7b3f8135db40fd0c4ff45))

## [0.1.4](https://github.com/gentrace/gentrace-node/compare/v0.1.3...v0.1.4) (2023-04-04)


### Miscellaneous Chores

* release 0.1.4 ([db69ddb](https://github.com/gentrace/gentrace-node/commit/db69ddbde6f2fbf0e240a945dc2a3349024e4ea0))
* release 0.1.4 ([284abe0](https://github.com/gentrace/gentrace-node/commit/284abe034bb1d685a2fde2722c373d51d9e2b747))

## [0.1.3](https://github.com/gentrace/gentrace-node/compare/v0.1.2...v0.1.3) (2023-04-04)


### Bug Fixes

* rename handler functions ([94ea7a3](https://github.com/gentrace/gentrace-node/commit/94ea7a32be9f127ef2117d80585702500ac8d3e1))


### Miscellaneous Chores

* release 0.1.3 ([c037238](https://github.com/gentrace/gentrace-node/commit/c037238f048cfff822a659d5b327b1f1333971f3))

## [0.1.2](https://github.com/gentrace/gentrace-node/compare/v0.1.1...v0.1.2) (2023-04-04)


### Miscellaneous Chores

* release 0.1.2 ([a159e20](https://github.com/gentrace/gentrace-node/commit/a159e2022d860628bbe6d132db0b7c53946d57a0))

## [0.1.1](https://github.com/gentrace/gentrace-node/compare/v0.1.0...v0.1.1) (2023-04-04)


### Bug Fixes

* add changes to OpenAI providers ([90418de](https://github.com/gentrace/gentrace-node/commit/90418de763c48db742d384012e0583566ce1ce50))

## [0.1.0](https://github.com/gentrace/gentrace-node/compare/v0.0.14...v0.1.0) (2023-04-04)


### Features

* Add in the custom provider logic ([8209325](https://github.com/gentrace/gentrace-node/commit/8209325f7858f770601777b7b29b557e54e3cf53))

## [0.0.14](https://github.com/gentrace/gentrace-node/compare/v0.0.13...v0.0.14) (2023-04-04)


### Miscellaneous Chores

* release 0.0.13 ([78d12f0](https://github.com/gentrace/gentrace-node/commit/78d12f0d3a89b174a993b569e410498127de4f55))
* release 0.0.14 ([0d542d8](https://github.com/gentrace/gentrace-node/commit/0d542d8fb3097122ecd3534aaf8ae2cc954b35b0))

## [0.0.13](https://github.com/gentrace/gentrace-node/compare/v0.0.13...v0.0.13) (2023-04-04)


### Miscellaneous Chores

* release 0.0.13 ([78d12f0](https://github.com/gentrace/gentrace-node/commit/78d12f0d3a89b174a993b569e410498127de4f55))

## [0.0.13](https://github.com/gentrace/gentrace-node/compare/v0.0.12...v0.0.13) (2023-04-03)


### Miscellaneous Chores

* release 0.0.12 ([f8dd325](https://github.com/gentrace/gentrace-node/commit/f8dd325a90c0dca42e54dfcd69f387cf7692f39d))
* release 0.0.13 ([2c35e1d](https://github.com/gentrace/gentrace-node/commit/2c35e1df05665ccbf00b54b7015200f1247295ca))

## [0.0.12](https://github.com/gentrace/gentrace-node/compare/v0.0.12...v0.0.12) (2023-04-03)


### Miscellaneous Chores

* release 0.0.12 ([f8dd325](https://github.com/gentrace/gentrace-node/commit/f8dd325a90c0dca42e54dfcd69f387cf7692f39d))

## [0.0.12](https://github.com/gentrace/gentrace-node/compare/v0.0.11...v0.0.12) (2023-04-03)


### Miscellaneous Chores

* release 0.0.12 ([02d5f07](https://github.com/gentrace/gentrace-node/commit/02d5f07ca8a0f255653170325fbf33325d5daaf3))

## [0.0.11](https://github.com/gentrace/gentrace-node/compare/v0.0.10...v0.0.11) (2023-04-03)


### Miscellaneous Chores

* release 0.0.11 ([d760c1d](https://github.com/gentrace/gentrace-node/commit/d760c1d6a58503dc4f310e06d8f551709bdfca57))

## [0.0.10](https://github.com/gentrace/gentrace-node/compare/v0.0.9...v0.0.10) (2023-04-03)


### Miscellaneous Chores

* release 0.0.10 ([2a1d951](https://github.com/gentrace/gentrace-node/commit/2a1d951be886b29e80da67bac6940da3f6cd45fc))

## [0.0.9](https://github.com/gentrace/gentrace-node/compare/v0.0.9...v0.0.9) (2023-04-03)


### Miscellaneous Chores

* release 0.0.8 ([f7bcf50](https://github.com/gentrace/gentrace-node/commit/f7bcf50a39bbbde4488c0c5fcdc6d0aa8c5e33ed))
* release 0.0.9 ([a0aec50](https://github.com/gentrace/gentrace-node/commit/a0aec50f3ae5a2ab99a4ac3adc38837d889f0900))

## 0.0.9 (2023-04-03)


### Miscellaneous Chores

* release 0.0.8 ([f7bcf50](https://github.com/gentrace/gentrace-node/commit/f7bcf50a39bbbde4488c0c5fcdc6d0aa8c5e33ed))
* release 0.0.9 ([a0aec50](https://github.com/gentrace/gentrace-node/commit/a0aec50f3ae5a2ab99a4ac3adc38837d889f0900))

## [0.0.3] - 2023-04-03

### Added
- Initial release of the NodeJS SDK
