import { pinecone } from "@gentrace/node";

pinecone({
  gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
  gentraceBasePath: "http://localhost:3000/api/v1",
  config: {
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  },
}).then((pinecone) => {
  async function deletePineconeIndex() {
    await pinecone.init();

    const index = await pinecone.Index("openai-trec");

    const deleteResponse = await index.delete1({
      pipelineId: "pinecone-delete-self-contained",
      ids: ["3890"],
    });
    console.log("deleteResponse", deleteResponse);
  }

  deletePineconeIndex();
});
