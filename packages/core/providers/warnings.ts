import chalk from "chalk";
import boxen from "boxen";

export class DeprecationWarning {
  title: string;
  message: string[];

  constructor(title: string, message: string | string[]) {
    this.title = title;
    this.message = Array.isArray(message) ? message : [message];
  }

  display(): void {
    try {
      // Build the formatted message
      const messageLines: string[] = [];

      // Add the main message
      for (const line of this.message) {
        messageLines.push(line);
      }

      const fullMessage = messageLines.join("\n");

      // Create the title with warning emoji
      const formattedTitle = `⚠️  ${this.title}`;

      // Display using boxen with red border for deprecation
      console.error(
        "\n" +
          boxen(fullMessage, {
            title: chalk.red.bold(formattedTitle),
            titleAlignment: "center",
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "red",
          }) +
          "\n",
      );
    } catch (error) {
      // Fallback to simple console error if formatting fails
      console.error(`⚠️  ${this.title}\n\n${this.message.join("\n")}\n`);
    }
  }
}

// Pre-defined deprecation warning
export const GentraceDeprecationWarning = () =>
  new DeprecationWarning("PACKAGE DEPRECATED", [
    chalk.red.bold(
      "This package (@gentrace/core) is deprecated. We will still be maintaining fixes for this package but encourage users to move to our next-generation library.",
    ),
    "",
    "You need to install the new package:",
    "",
    chalk.green("  npm install gentrace"),
    "",
    "The new package provides improved functionality and continued support.",
    "Please migrate to the new package as soon as possible.",
    "",
    "For more information about using the new package, visit:",
    chalk.cyan("  https://gentrace.ai/docs"),
  ]);
