import { init, GentraceSession } from "@gentrace/playground";
import OpenAI from "openai";
import * as Mustache from "mustache";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  runName: "Example run for Playground SDK",
  basePath: "http://localhost:3000/api",
  //basePath: "https://staging.gentrace.ai/api",
});

// Demo example using OpenAI to summarize text

const gentrace = new GentraceSession();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY ?? "",
});

function createInterpolatedMessages(template: object, inputs: object): string {
  // console.log("createInterpolatedMessages template: "+JSON.stringify(template));
  // fill in template with inputs
  const rendered = Mustache.render(JSON.stringify(template), inputs);
  return JSON.parse(rendered);
}

async function summarizeTextOpenAI(
  stepName: string,
  method: string,
  args: object,
  inputs: object,
): Promise<string> {
  if (method !== "openai.chat.completions.create") {
    throw new Error("Method " + method + " is not supported.");
  }

  if (!inputs) {
    inputs = {};
  }

  const { newArgs, id, cachedOutput } = gentrace.getStepInfo(
    stepName,
    method,
    args,
    inputs,
  );

  if (cachedOutput && cachedOutput.length > 0) {
    console.log("CACHE: using cachedOutput: " + cachedOutput);
    gentrace.submitOutput(id, cachedOutput);
    return cachedOutput;
  }

  console.log(
    "interpolatedMessage: " +
      JSON.stringify(createInterpolatedMessages(newArgs.messages, inputs)),
  );

  const messages: any = createInterpolatedMessages(newArgs.messages, inputs);

  try {
    const completion = await openai.chat.completions.create({
      model: newArgs.model, // gpt-3.5-turbo, gpt-4, etc.
      messages: messages,
      temperature: newArgs.temperature,
    });

    const output = completion.choices[0].message.content || "";
    gentrace.submitOutput(id, output);

    return output;
  } catch (error) {
    console.error("Error:", error);
  }
  return "";
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
  const promptTemplate = `Task Name: {{task_name}}
Task Description: {{task_description}}
Assignee Name: {{assignee_name}}
Assignee Email: {{assignee_email}}
Viewer Name: {{viewer_name}}`;

  const inputs = {
    task_name: task.taskName,
    task_description: task.taskDescription,
    assignee_name: task.assignee.name,
    assignee_email: task.assignee.email,
    viewer_name: viewer.name,
  };

  const defaultArgs = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "Summarize the task you are provided with for a second-grade student. If the assignee and the viewer are the same person, use 'your task' to describe the task. If the assignee and the viewer are different people, use the assignee's name in the summary.",
      },
      {
        role: "user",
        content: promptTemplate,
      },
    ],
    temperature: 0.1,
  };

  const stepName = "Summarization step";
  const method = "openai.chat.completions.create";

  const summary = await summarizeTextOpenAI(
    stepName,
    method,
    defaultArgs,
    inputs,
  );

  // second step...

  const defaultArgsTranslate = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Please translate this into Portuguese.",
      },
      {
        role: "user",
        content: summary,
      },
    ],
    temperature: 0.1,
  };

  const translation = await summarizeTextOpenAI(
    "Translation step",
    "openai.chat.completions.create",
    defaultArgsTranslate,
    null,
  );

  return { summary: translation };
}

async function demoExample() {
  const userAlice = new User("Alice", "alice@example.com");
  const userBob = new User("Bob", "bob@example.com");

  const taskForBob = new Task(
    "Create a mobile app for waste sorting and recycling", // task content from ChatGPT
    "Create a mobile app that gamifies waste sorting and recycling for households. The app will use image recognition to identify different types of waste and instruct users on how to properly dispose of them. It will also track and reward users with points for consistent recycling efforts, which can be redeemed for eco-friendly products or services. The task includes researching the most common types of household waste, developing a user-friendly interface, and partnering with local environmental organizations for reward redemption. Finally, launch a community challenge feature within the app to foster a competitive spirit of sustainability among neighborhoods.",
    userBob,
  );

  gentrace.registerCustomType("User");
  gentrace.registerCustomObject("User", "Alice", userAlice);
  gentrace.registerCustomObject("User", "Bob", userBob);
  gentrace.registerCustomType("Task");
  gentrace.registerCustomObject("Task", taskForBob.taskName, taskForBob);

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
