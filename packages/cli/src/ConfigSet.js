import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import React, { useState } from "react";
import { gentraceConfigFile, updateJsonFile } from "./utils.js";

const OPTIONS = [
  {
    name: "apiKey",
    description: "Set API Key",
  },
  {
    name: "activePipelineSlug",
    description: "Set active pipeline slug",
  },
];

function ConfigSet({ options }) {
  const [selectedOption, setSelectedOption] = useState(0);
  const [activeOption, setActiveOption] = useState(null);

  const [activeOptionValue, setActiveOptionValue] = useState("");

  useInput((input, key) => {
    if (key.upArrow && selectedOption > 0) {
      setSelectedOption((prev) => prev - 1);
    }

    if (key.downArrow && selectedOption < OPTIONS.length - 1) {
      setSelectedOption((prev) => prev + 1);
    }

    if (key.return) {
      setActiveOption(selectedOption);
    }
  });

  return (
    <>
      {activeOption === null ? (
        <Box flexDirection="column">
          {OPTIONS.map((option, index) => (
            <Text key={option.name}>
              {selectedOption === index ? (
                <Text color="green">{">"}</Text>
              ) : (
                " "
              )}
              {option.description}
            </Text>
          ))}
        </Box>
      ) : null}

      {activeOption !== null ? (
        <TextInput
          placeholder={OPTIONS[activeOption].description}
          value={activeOptionValue}
          onChange={(value) => {
            setActiveOptionValue(value);
          }}
          onSubmit={(value) => {
            updateJsonFile(
              gentraceConfigFile,
              {
                [OPTIONS[activeOption].name]: value,
              },
              () => {
                process.exit();
              }
            );
          }}
        />
      ) : null}
    </>
  );
}

export default ConfigSet;
