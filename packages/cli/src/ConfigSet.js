import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import Link from "ink-link";
import { useEffect, useState } from "react";
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
    validate: (value) => {
      if (!value) {
        return [false, "Pipeline slug cannot be empty"];
      }

      return [true, null];
    },
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
      <Box paddingBottom={1}>
        <Text color="green">
          Configuration stored at ~/.gentrace/config.json
        </Text>
      </Box>
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
        <Box paddingBottom={1}>
          <TextInput
            placeholder={OPTIONS[activeOption].description}
            value={activeOptionValue}
            onChange={(value) => {
              setActiveOptionValue(value);
            }}
            onSubmit={(value) => {
              if (OPTIONS[activeOption].validate) {
                const [isValid, returnedMessage] =
                  OPTIONS[activeOption].validate(value);

                if (!isValid) {
                  setErrorMessage(returnedMessage);
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
        </Box>
      ) : null}

      {activeOption !== null && OPTIONS[activeOption].name === "apiKey" ? (
        <Box>
          <Text>No API key?</Text>
          <Text> </Text>
          <Link url="https://gentrace.ai/settings/api-keys">
            <Text>Create one here</Text>
          </Link>
        </Box>
      ) : null}

      {activeOption !== null &&
      OPTIONS[activeOption].name === "activePipelineSlug" ? (
        <Box>
          <Text>No pipeline slug?</Text>
          <Text> </Text>
          <Link url="https://gentrace.ai/pipeline/new">
            <Text>Create one here</Text>
          </Link>
        </Box>
      ) : null}

      {errorMessage ? <Text color="red">{errorMessage}</Text> : null}
    </>
  );
}

export default ConfigSet;
