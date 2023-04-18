import { getPinecone } from "@gentrace/node";

getPinecone({
  gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
  gentraceBasePath: "http://localhost:3000/api/v1",
  config: {
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  },
}).then((pinecone) => {
  async function fetchPineconeIndex() {
    await pinecone.init();

    const index = await pinecone.Index("openai-trec");

    const fetchResponse = await index.fetch({
      pipelineId: "pinecone-fetch-self-contained",
      ids: ["3890"],
    });

    console.log("fetchResponse", fetchResponse);
  }

  fetchPineconeIndex();
});
