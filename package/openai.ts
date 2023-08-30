import { SimpleOpenAI } from "./providers/simple/openai";

export default SimpleOpenAI;

export {
  // Deprecated: we made a mistake with the import matching for the native OpenAI SDK.
  // Both of the following are deprecated and will be removed in future versions.
  SimpleOpenAI as OpenAIApi,
  SimpleOpenAI as OpenAI,
};
