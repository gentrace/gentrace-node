import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

function writeOpenAIPackageJson(path: string, privacy: boolean) {
  // Define the path to the package.json file.
  const packageJsonPath = join(__dirname, path);

  // Read the package.json file.
  const packageJsonString = readFileSync(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonString);

  if (privacy) {
    // Modify the private property.
    packageJson.private = true;
  } else {
    delete packageJson["private"];
    packageJson["name"] = "@gentrace/openai";
  }

  // Write the modified package.json back to the file.
  const updatedPackageJsonString = JSON.stringify(packageJson, null, 2);
  writeFileSync(packageJsonPath, updatedPackageJsonString, "utf8");

  console.log("Updated package.json to set private property to true.");
}

writeOpenAIPackageJson("../packages/openai/package.json", true);
writeOpenAIPackageJson("../packages/openai-v3/package.json", false);
