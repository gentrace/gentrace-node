import { pinecone } from "@gentrace/node";
import { DEFAULT_VECTOR } from "../utils";

pinecone({
  gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
  gentraceBasePath: "http://localhost:3000/api/v1",
  config: {
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  },
}).then((pinecone) => {
  async function upsertPineconeIndex() {
    await pinecone.init();

    const index = await pinecone.Index("openai-trec");

    const upsertResponse = await index.upsert({
      pipelineId: "pinecone-upsert-self-contained",
      upsertRequest: {
        vectors: [
          {
            id: String(Math.floor(Math.random() * 10000)),
            values: DEFAULT_VECTOR,
          },
        ],
      },
    });

    console.log("upsertResponse", upsertResponse);
  }

  upsertPineconeIndex();
});
