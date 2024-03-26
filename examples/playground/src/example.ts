import { init, GentraceSession } from "@gentrace/playground";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  runName: "Example run for Playground SDK",
  basePath: "http://localhost:3000/api",
});

console.log("process.env.GENTRACE_API_KEY:   " + process.env.GENTRACE_API_KEY);

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

// Demo example
const gentrace = new GentraceSession();

async function summarizeTaskForViewer(
  task: Task,
  viewer: User,
): Promise<object> {
  console.log("summarizeTaskForViewer task: " + task);
  console.log("summarizeTaskForViewer user: " + viewer);

  let newArgs, id; // outputs to getStepInfo function

  // first step

  ({ newArgs, id } = gentrace.getStepInfo("Summarization step 1", {
    provider: {
      type: "model",
      default: "openai/gpt-3.5-turbo",
    },
    prompt: {
      type: "text",
      default:
        "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way - in short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only.",
    },
  }));

  console.log(
    "summarizeTaskForViewer new_args (1): " + JSON.stringify(newArgs),
  );
  console.log("summarizeTaskForViewer id (1): " + id);

  // second step
  /*
  ({ newArgs, id } = gentrace.getStepInfo("Summarization step 2", {
    prompt: { type: "textField", default: "You are a helpful assistant...." },
    temperature: { type: "slider", min: 0, max: 1, default: 0.5 },
  }));

  console.log("summarizeTaskForViewer new_args (2): " + JSON.stringify(newArgs));
  console.log("summarizeTaskForViewer id (2): " + id);
*/
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
