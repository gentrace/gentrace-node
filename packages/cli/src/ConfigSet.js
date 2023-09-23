import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import React, { useEffect, useState } from "react";
import { gentraceConfigFile, updateJsonFile } from "./utils.js";

const OPTIONS = [
  {
    name: "apiKey",
    description: "Set API Key",
    validate: (value) => {
      if (!value.startsWith("gen_api_")) {
        return [false, "API Key must start with gen_api_"];
      }

      if (value.length !== 48) {
        return [false, "API Key must be 48 characters long"];
      }

      return [true, null];
    },
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

  const [errorMessage, setErrorMessage] = useState(null);

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

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    process.exit(1);
  }, [errorMessage]);

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
            if (OPTIONS[activeOption].validate) {
              const [isValid, errorMessage] =
                OPTIONS[activeOption].validate(value);

              if (!isValid) {
                errorMessage(errorMessage);
                return;
              }
            }

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

      {errorMessage ? <Text color="red">{errorMessage}</Text> : null}
    </>
  );
}

export default ConfigSet;
