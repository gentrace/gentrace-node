const { Box, Text } = require("ink");
const { useEffect, useState } = require("react");
const fs = require("fs");
const { gentraceConfigFile } = require("./utils.js");
const clipboard = require("clipboardy");

function ConfigGet({ options }) {
  const [config, setConfig] = useState(null);
  const [clipboardNotification, setClipboardNotification] = useState(false);

  useEffect(() => {
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

module.exports = ConfigGet;
module.exports.default = ConfigGet;
