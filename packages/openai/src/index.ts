import { SimpleOpenAI } from "./handlers/simple";
import { initPlugin, OpenAIPlugin } from "./plugin";
import {
  OpenAICreateChatCompletionStepRun,
  OpenAICreateCompletionStepRun,
  OpenAICreateEmbeddingStepRun,
} from "./openai";

export {
  initPlugin,
  OpenAIPlugin,
  SimpleOpenAI as OpenAI,

  // Export step runs for custom integrations that might need it
  OpenAICreateChatCompletionStepRun,
  OpenAICreateCompletionStepRun,
  OpenAICreateEmbeddingStepRun,
};
export default SimpleOpenAI;
