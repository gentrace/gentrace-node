import fs from "fs";
import os from "os";

const homeDir = os.homedir();

export const gentraceEnvDir = `${homeDir}/.gentrace`;

export const gentraceConfigFile = `${gentraceEnvDir}/config.json`;

export function ensureDotFilesCreated() {
  if (!fs.existsSync(gentraceEnvDir)) {
    fs.mkdirSync(gentraceEnvDir);
  }

  if (!fs.existsSync(gentraceConfigFile)) {
    fs.writeFileSync(gentraceConfigFile, "{}");
  }
}

export function updateJsonFile(filePath, newData, callback) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      callback(err);
      return;
    }

    try {
      const jsonData = JSON.parse(data);

      // Update the JSON values with newData
      Object.assign(jsonData, newData);

      const updatedData = JSON.stringify(jsonData, null, 2);

      fs.writeFile(filePath, updatedData, "utf8", (err) => {
        if (err) {
          callback(err);
        } else {
          callback(null, jsonData);
        }
      });
    } catch (err) {
      callback(err);
    }
  });
}
