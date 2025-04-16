# Pipelines

Types:

- <code><a href="./src/resources/pipelines.ts">Pipeline</a></code>
- <code><a href="./src/resources/pipelines.ts">PipelineList</a></code>

Methods:

- <code title="post /v4/pipelines">client.pipelines.<a href="./src/resources/pipelines.ts">create</a>({ ...params }) -> Pipeline</code>
- <code title="get /v4/pipelines/{id}">client.pipelines.<a href="./src/resources/pipelines.ts">retrieve</a>(id) -> Pipeline</code>
- <code title="post /v4/pipelines/{id}">client.pipelines.<a href="./src/resources/pipelines.ts">update</a>(id, { ...params }) -> Pipeline</code>
- <code title="get /v4/pipelines">client.pipelines.<a href="./src/resources/pipelines.ts">list</a>({ ...params }) -> string</code>

# Experiments

Types:

- <code><a href="./src/resources/experiments.ts">Experiment</a></code>
- <code><a href="./src/resources/experiments.ts">ExperimentList</a></code>

Methods:

- <code title="post /v4/experiments">client.experiments.<a href="./src/resources/experiments.ts">create</a>({ ...params }) -> Experiment</code>
- <code title="get /v4/experiments/{id}">client.experiments.<a href="./src/resources/experiments.ts">retrieve</a>(id) -> Experiment</code>
- <code title="post /v4/experiments/{id}">client.experiments.<a href="./src/resources/experiments.ts">update</a>(id, { ...params }) -> Experiment</code>
- <code title="get /v4/experiments">client.experiments.<a href="./src/resources/experiments.ts">list</a>({ ...params }) -> string</code>

# Datasets

Types:

- <code><a href="./src/resources/datasets.ts">Dataset</a></code>
- <code><a href="./src/resources/datasets.ts">DatasetList</a></code>

Methods:

- <code title="post /v4/datasets">client.datasets.<a href="./src/resources/datasets.ts">create</a>({ ...params }) -> Dataset</code>
- <code title="get /v4/datasets/{id}">client.datasets.<a href="./src/resources/datasets.ts">retrieve</a>(id) -> Dataset</code>
- <code title="post /v4/datasets/{id}">client.datasets.<a href="./src/resources/datasets.ts">update</a>(id, { ...params }) -> Dataset</code>
- <code title="get /v4/datasets">client.datasets.<a href="./src/resources/datasets.ts">list</a>({ ...params }) -> string</code>

# TestCases

Types:

- <code><a href="./src/resources/test-cases.ts">TestCase</a></code>
- <code><a href="./src/resources/test-cases.ts">TestCaseList</a></code>
- <code><a href="./src/resources/test-cases.ts">TestCaseDeleteResponse</a></code>

Methods:

- <code title="post /v4/test-cases">client.testCases.<a href="./src/resources/test-cases.ts">create</a>({ ...params }) -> TestCase</code>
- <code title="get /v4/test-cases/{id}">client.testCases.<a href="./src/resources/test-cases.ts">retrieve</a>(id) -> TestCase</code>
- <code title="get /v4/test-cases">client.testCases.<a href="./src/resources/test-cases.ts">list</a>({ ...params }) -> string</code>
- <code title="delete /v4/test-cases/{id}">client.testCases.<a href="./src/resources/test-cases.ts">delete</a>(id) -> TestCaseDeleteResponse</code>
