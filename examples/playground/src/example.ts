import { init, GentraceSession } from "@gentrace/playground";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  runName: "Example run for Playground SDK",
  basePath: "http://localhost:3000/api",
});

console.log("process.env.GENTRACE_API_KEY:   " + process.env.GENTRACE_API_KEY);

// Task and User objects for demo example

class Task {
  task_name: string;
  task_description: string;
  assignee: User;

  constructor(task_name: string, task_description: string, assignee: User) {
    this.task_name = task_name;
    this.task_description = task_description;
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

// Demo example
const gentrace = new GentraceSession();

async function summarizeTaskForViewer(
  task: Task,
  viewer: User,
): Promise<object> {
  console.log("summarizeTaskForViewer task: " + task);
  console.log("summarizeTaskForViewer user: " + viewer);

  let new_args, id; // outputs to getStepInfo function

  // first step

  ({ new_args, id } = gentrace.getStepInfo("Summarization step 1", {
    prompt: { type: "textField", default: "You are a helpful assistant...." },
    temperature: { type: "slider", min: 0, max: 1, default: 0.5 },
  }));

  console.log("summarizeTaskForViewer new_args (1): " + new_args);
  console.log("summarizeTaskForViewer id (1): " + id);

  // second step

  ({ new_args, id } = gentrace.getStepInfo("Summarization step 2", {
    prompt: { type: "textField", default: "You are a helpful assistant...." },
    temperature: { type: "slider", min: 0, max: 1, default: 0.5 },
  }));

  console.log("summarizeTaskForViewer new_args (2): " + new_args);
  console.log("summarizeTaskForViewer id (2): " + id);

  return {
    answer: "summarizeTaskForViewer output",
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
      task: "defaultTask",
      viewer: "defaultViewer",
    },
    { summary: "string" },
    (inputs: { task: Task; viewer: User }) =>
      summarizeTaskForViewer(inputs.task, inputs.viewer),
  );

  gentrace.start();
}

demoExample();
