import React, { useEffect, useState } from "react";
import { render, Text, useInput, Box } from "ink";
import TextInput from "ink-text-input";
import { init, getTestCases } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY,
  basePath: "http://localhost:3000/api/v1",
});

function GentraceApp({ command, options }) {
  const [apiKey, setApiKey] = useState("");

  switch (command) {
    case "cases-create":
      // Call API or handle logic for case creation

      return <Text>Create Case Logic</Text>;

    case "cases-get":
      // Handle logic for getting cases
      return <CaseList />;

    case "config-set":
      return (
        <TextInput
          value="Set API Key: "
          onChange={(value) => {
            setApiKey(value);
          }}
          onSubmit={() => {
            console.log(apiKey);
            process.exit();
          }}
        />
      );

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
  render(<GentraceApp command={command} options={options || {}} />);
};
