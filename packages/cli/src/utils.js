const fs = require("fs");
const os = require("os");

const homeDir = os.homedir();

const gentraceEnvDir = `${homeDir}/.gentrace`;

const gentraceConfigFile = `${gentraceEnvDir}/config.json`;

function ensureDotFilesCreated() {
  if (!fs.existsSync(gentraceEnvDir)) {
    fs.mkdirSync(gentraceEnvDir);
  }

  if (!fs.existsSync(gentraceConfigFile)) {
    fs.writeFileSync(gentraceConfigFile, "{}");
  }
}

function getConfig() {
  return JSON.parse(fs.readFileSync(gentraceConfigFile, "utf8"));
}

const config = getConfig();

function updateJsonFile(filePath, newData, callback) {
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

module.exports = {
  ensureDotFilesCreated,
  updateJsonFile,
  config,
  gentraceConfigFile,
  gentraceEnvDir,
};
