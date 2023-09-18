#!/usr/bin/env NODE_NO_WARNINGS=1 node --loader=import-jsx

import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { run } from "./gentrace-interface.js";

const argv = yargs(hideBin(process.argv)).argv;

// This will launch our React-Ink interface
async function launchInterface(command, options) {
  process.env.FORCE_COLOR = "1";
  run(command, options);
}

// Define your command structure
yargs(process.argv.slice(2))
  .command("cases create", "create a case", {}, () =>
    launchInterface("cases-create")
  )
  .command("cases get", "get cases", {}, () => launchInterface("cases-get"))
  .command(
    "config set",
    "set config",
    (yargs) => {
      return yargs.option("apiKey", {
        describe: "API key to set",
        type: "string",
      });
    },
    (argv) => launchInterface("config-set", argv)
  )
  .demandCommand(1, "") // requires at least one command
  .strict()
  .help().argv;
