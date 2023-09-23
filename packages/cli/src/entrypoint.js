import React, { useEffect, useState } from "react";
import { render, Text, useInput, Box } from "ink";
import { init, getTestCases } from "@gentrace/core";
import ConfigSet from "./ConfigSet.js";
import ConfigGet from "./ConfigGet.js";

init({
  apiKey: process.env.GENTRACE_API_KEY,
  basePath: "http://localhost:3000/api/v1",
});

function Entrypoint({ command, options }) {
  switch (command) {
    case "cases-create":
      // Call API or handle logic for case creation

      return <Text>Create Case Logic</Text>;

    case "cases-get":
      // Handle logic for getting cases
      return <CaseList />;

    case "config-set":
      return <ConfigSet options={options} />;

    case "config-get":
      return <ConfigGet options={options} />;

    default:
      return <Text>Unknown command</Text>;
  }
}

function CaseList() {
  const [cases, setCases] = useState([]);
  const [selectedOption, setSelectedOption] = React.useState(0);

  useEffect(() => {
    getTestCases("testing-pipeline-id").then((cases) => {
      setCases(cases);
    });
  }, []);

  useInput((input, key) => {
    if (key.upArrow && selectedOption > 0) {
      setSelectedOption((prev) => prev - 1);
    }

    if (key.downArrow && selectedOption < cases.length - 1) {
      setSelectedOption((prev) => prev + 1);
    }

    if (key.return) {
      console.log(`Selected: ${cases[selectedOption]}`);
      process.exit();
    }
  });

  return (
    <Box flexDirection="column">
      {cases.map((testCase, index) => (
        <Text key={testCase.id}>
          {selectedOption === index ? <Text color="green">{">"}</Text> : " "}
          {testCase.name}
        </Text>
      ))}
    </Box>
  );
}

export const run = (command, options) => {
  render(<Entrypoint command={command} options={options || {}} />);
};
