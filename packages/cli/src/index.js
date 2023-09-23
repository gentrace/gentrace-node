#!/usr/bin/env NODE_NO_WARNINGS=1 node

// Usage: only run this directly without using dotenv-cli (or equivalent) to run the
// script. Otherwise, yargs will not be able to parse the command line arguments
// correctly.

import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { run } from "./entrypoint.js";
import { ensureDotFilesCreated } from "./utils.js";

ensureDotFilesCreated();

async function launch(command, options) {
  process.env.FORCE_COLOR = "1";
  run(command, options);
}

yargs(hideBin(process.argv))
  .command("cases", "Manage test cases", (yargs) => {
    yargs
      .command(
        "create",
        "Create test case(s)",
        (yargs) => {
          yargs.option("file", {
            alias: "file",
            describe: "File containing test case(s)",
            type: "string",
            demandOption: true,
          });
        },
        (argv) => launch("cases-create", argv)
      )
      .command("get", "Get test cases", {}, () => launch("cases-get"));
  })
  .command("config", "Manage configuration", (yargs) => {
    yargs
      .command("set", "Set configuration options", {}, () => {
        launch("config-set");
      })
      .command("get", "Get configuration options", {}, () => {
        launch("config-get");
      });
  })
  .demandCommand(1, "") // requires at least one command
  .strict()
  .help().argv;
