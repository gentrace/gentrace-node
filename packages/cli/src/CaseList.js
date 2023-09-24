import { getTestCases } from "@gentrace/core";
import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";
import { config } from "./utils.js";
import clipboard from "clipboardy";

function CaseList() {
  const [cases, setCases] = useState([]);
  const [selectedOption, setSelectedOption] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [clipboardNotification, setClipboardNotification] = useState(false);

  useEffect(() => {
    getTestCases(config.activePipelineSlug)
      .then((cases) => {
        setCases(cases);
      })
      .catch((err) => {
        setErrorMessage(err.message);
        process.exit(1);
      });
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }
  }, [config]);

  useInput((input, key) => {
    if (key.upArrow && selectedOption > 0) {
      setSelectedOption((prev) => prev - 1);
    }

    if (key.downArrow && selectedOption < cases.length - 1) {
      setSelectedOption((prev) => prev + 1);
    }

    if (key.return) {
      clipboard.writeSync(JSON.stringify(cases[selectedOption], null, 2));
      setClipboardNotification(true);
    }
  });

  useEffect(() => {
    if (!clipboardNotification) {
      return;
    }

    process.exit();
  }, [clipboardNotification]);

  return (
    <>
      <Box flexDirection="column">
        {cases.map((testCase, index) => (
          <Text key={testCase.id}>
            {selectedOption === index ? <Text color="green">{">"}</Text> : " "}
            {testCase.name}
          </Text>
        ))}
      </Box>
      <Box>
        <Text color="red">{errorMessage}</Text>
      </Box>

      {clipboardNotification && (
        <Box>
          <Text color="green"> 📋 Copied to clipboard!</Text>
        </Box>
      )}
    </>
  );
}

export default CaseList;
