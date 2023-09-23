import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import fs from "fs";
import { gentraceConfigFile } from "./utils.js";
import clipboard from "clipboardy";

function ConfigGet({ options }) {
  const [config, setConfig] = useState(null);
  const [clipboardNotification, setClipboardNotification] = useState(false);

  useEffect(() => {
    console.log("ConfigGet");

    fs.readFile(gentraceConfigFile, "utf8", (err, data) => {
      setConfig(JSON.stringify(JSON.parse(data), null, 2));
    });
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }

    clipboard.writeSync(config);
    setClipboardNotification(true);
  }, [config]);

  return (
    <>
      <Box>
        <Text>{config}</Text>
      </Box>

      <Box>
        <Text color="green"> 📋 Copied to clipboard!</Text>
      </Box>
    </>
  );
}

export default ConfigGet;
