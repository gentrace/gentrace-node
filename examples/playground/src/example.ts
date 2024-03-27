import { init, GentraceSession } from "@gentrace/playground";
import OpenAI from "openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  runName: "Example run for Playground SDK",
  // basePath: "http://localhost:3000/api",
  basePath: "https://staging.gentrace.ai/api",
});

// Demo example using OpenAI to summarize text

const gentrace = new GentraceSession();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY ?? "",
});

async function summarizeTextOpenAI_Step1(
  model: string,
  text: string,
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: model, // gpt-3.5-turbo, gpt-4, etc.
      messages: [
        {
          role: "system", // content suggested in OpenAI docs
          content:
            "You are a highly skilled AI trained in language comprehension and summarization. I would like you to read the following text and summarize it into a concise abstract paragraph. Aim to retain the most important points, providing a coherent and readable summary that could help a person understand the main points of the discussion without needing to read the entire text. Please avoid unnecessary details or tangential points.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.1,
    });

    return completion.choices[0].message.content || "";
  } catch (error) {
    console.error("Error:", error);
  }
  return "";
}

async function summarizeTextOpenAI_Step2(
  model: string,
  text: string,
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: model, // gpt-3.5-turbo, gpt-4, etc.
      messages: [
        {
          role: "system",
          content: "You are able to summarize text into one sentence.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.1,
    });

    return completion.choices[0].message.content || "";
  } catch (error) {
    console.error("Error:", error);
  }
  return "";
}

// utility function to get the substring after a / (slash)
function getModelName(input: string): string {
  if (input.length > 0) {
    const index = input.indexOf("/");

    if (index === -1) {
      return input;
    }
    return input.substring(index + 1);
  }
  return null;
}

// Task and User objects for demo example

class Task {
  taskName: string;
  taskDescription: string;
  assignee: User;

  constructor(taskName: string, taskDescription: string, assignee: User) {
    this.taskName = taskName;
    this.taskDescription = taskDescription;
    this.assignee = assignee;
  }
}

class User {
  name: string;
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

async function summarizeTaskForViewer(
  task: Task,
  viewer: User,
): Promise<object> {
  let newArgs, id, defaultArgs;

  // first step

  defaultArgs = {
    provider: {
      type: "model",
      default: "openai/gpt-3.5-turbo",
    },
    prompt: {
      type: "text",
      default:
        "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way - in short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only.",
    },
  };

  ({ newArgs, id } = gentrace.getStepInfo("Summarization step 1", defaultArgs));
  // newArgs format: { provider: "openai/gpt-4", prompt: "...."}

  const outputStep1 = await summarizeTextOpenAI_Step1(
    getModelName(newArgs.provider),
    newArgs.prompt,
  );

  // console.log("outputStep1: " + outputStep1);

  // second step

  defaultArgs = {
    provider: {
      type: "model",
      default: "openai/gpt-3.5-turbo",
    },
    prompt: {
      type: "text",
      default: outputStep1,
    },
  };

  ({ newArgs, id } = gentrace.getStepInfo("Summarization step 2", defaultArgs));

  const outputStep2 = await summarizeTextOpenAI_Step2(
    getModelName(newArgs.provider),
    newArgs.prompt,
  );

  // console.log("outputStep2: " + outputStep2);

  return {
    summary: outputStep2,
  };
}

async function demoExample() {
  const userAlice = new User("Alice", "alice@example.com");
  const userBob = new User("Bob", "bob@example.com");
  const taskForBob = new Task(
    "Go get groceries",
    "5 apples and 2 bananas",
    userBob,
  );

  gentrace.registerCustomType("User");
  gentrace.registerCustomObject("User", "Alice", userAlice);
  gentrace.registerCustomObject("User", "Bob", userBob);
  gentrace.registerCustomType("Task");
  gentrace.registerCustomObject("Task", "A simple task for Bob", taskForBob);

  gentrace.registerInteraction(
    "Summarize Task for Viewer",
    {
      task: "Task",
      viewer: "User",
    },
    { summary: "string" },
    (inputs: { task: Task; viewer: User }) =>
      summarizeTaskForViewer(inputs.task, inputs.viewer),
  );

  gentrace.start();
}

demoExample();
