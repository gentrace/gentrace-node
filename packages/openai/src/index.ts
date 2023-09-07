import { SimpleOpenAI } from "./handlers/simple";
import { initOpenAIPlugin, OpenAIPlugin } from "./plugin";

export { initOpenAIPlugin as initPlugin, OpenAIPlugin, SimpleOpenAI as OpenAI };
export default SimpleOpenAI;
