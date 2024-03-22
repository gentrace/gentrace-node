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

async function summarizeTaskForViewer(task: Task, viewer: User): string {
  return "summarizeTaskforViewer output";
}

async function demoExample() {
  const userAlice = new User("Alice", "alice@example.com");
  const userBob = new User("Bob", "bob@example.com");
  const taskForBob = new Task(
    "Go get groceries",
    "5 apples and 2 bananas",
    userBob,
  );

  const gentrace = new GentraceSession();

  gentrace.registerCustomType("User");
  gentrace.registerCustomObject("User", "Alice", userAlice);
  gentrace.registerCustomObject("User", "Bob", userBob);
  gentrace.registerCustomType("Task");
  gentrace.registerCustomObject("Task", "A simple task for Bob", taskForBob);

  gentrace.registerInteraction(
    "Summarize Task for Viewer",
    {
      task: "task",
      viewer: "user",
    },
    { summary: "string" },
    (inputs: { task: Task; viewer: User }) =>
      summarizeTaskForViewer(inputs.task, inputs.viewer),
  );

  gentrace.start();
}

demoExample();
