const { init } = require("@gentrace/core");
const { Text, render } = require("ink");
const React = require("react");
const { config } = require("./utils.js");
const importJsx = require("import-jsx");

// const CaseList = importJsx("./CaseList.js");
const CaseCreate = require("./CaseCreate.js");
// const ConfigGet = importJsx("./ConfigGet.js");
// const ConfigSet = importJsx("./ConfigSet.js");

init({
  apiKey: config.apiKey ?? process.env.GENTRACE_API_KEY,
});

function Entrypoint({ command, options }) {
  switch (command) {
    case "cases-create":
      return <CaseCreate options={options} />;

    // case "cases-get":
    //   return <CaseList />;

    // case "config-set":
    //   return <ConfigSet options={options} />;

    // case "config-get":
    //   return <ConfigGet options={options} />;

    default:
      return <Text>Unknown command</Text>;
  }
}

const run = (command, options) => {
  render(<Entrypoint command={command} options={options || {}} />);
};

module.exports = {
  run,
};
