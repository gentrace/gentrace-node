import { init } from "@gentrace/core";
import { Text, render } from "ink";
import React from "react";
import CaseList from "./CaseList.js";
import CaseCreate from "./CaseCreate.js";
import ConfigGet from "./ConfigGet.js";
import ConfigSet from "./ConfigSet.js";
import { config } from "./utils.js";

init({
  apiKey: config.apiKey ?? process.env.GENTRACE_API_KEY,
});

function Entrypoint({ command, options }) {
  switch (command) {
    case "cases-create":
      return <CaseCreate options={options} />;

    case "cases-get":
      return <CaseList />;

    case "config-set":
      return <ConfigSet options={options} />;

    case "config-get":
      return <ConfigGet options={options} />;

    default:
      return <Text>Unknown command</Text>;
  }
}

export const run = (command, options) => {
  render(<Entrypoint command={command} options={options || {}} />);
};
