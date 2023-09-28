import React from "react";
import { Text } from "ink";

const Key = ({ children }) => <Text color="cyan">{children}</Text>;
const StringValue = ({ children }) => <Text color="green">{children}</Text>;
const NumberValue = ({ children }) => <Text color="blue">{children}</Text>;
const Indent = ({ level }) => <Text>{" ".repeat(level * 2)}</Text>;

const JsonHighlighter = ({ json, level = 0 }) => {
  if (typeof json === "object" && json !== null) {
    const entries = Object.entries(json);

    return (
      <>
        <Text>{"{"}</Text>
        {entries.map(([key, value], index) => (
          <React.Fragment key={key}>
            <Text>{"\n"}</Text>
            <Indent level={level + 1} />
            <Key>{`"${key}"`}</Key>
            <Text>: </Text>
            <JsonHighlighter json={value} level={level + 1} />
            {index !== entries.length - 1 ? <Text>,</Text> : <Text />}
          </React.Fragment>
        ))}
        <Text>{"\n"}</Text>
        <Indent level={level} />
        <Text>{"}"}</Text>
      </>
    );
  } else if (typeof json === "string") {
    return <StringValue>{`"${json}"`}</StringValue>;
  } else if (typeof json === "number") {
    return <NumberValue>{json}</NumberValue>;
  } else if (json === null) {
    return <Text>null</Text>;
  } else if (typeof json === "boolean") {
    return <Text>{json.toString()}</Text>;
  } else {
    return <Text>{json}</Text>;
  }
};

export default JsonHighlighter;
