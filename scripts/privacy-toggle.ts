import { getPackages } from "@manypkg/get-packages";
import { readFileSync, writeFileSync } from "fs";

function writePriorVersionPackageJson(
  path: string,
  privacy: boolean,
  name?: string,
) {
  // Read the package.json file.
  const packageJsonString = readFileSync(path, "utf8");
  const packageJson = JSON.parse(packageJsonString);

  if (privacy) {
    // Modify the private property.
    packageJson.private = true;
  } else {
    delete packageJson["private"];
    packageJson["name"] = name;
  }

  // Write the modified package.json back to the file.
  const updatedPackageJsonString = JSON.stringify(packageJson, null, 2);
  writeFileSync(path, updatedPackageJsonString, "utf8");

  console.log("Updated package.json to set private property to true.");
}

const packages = getPackages(process.cwd());

packages.then((packages) => {
  for (const p of packages.packages) {
    if (p.packageJson.name === "@gentrace/openai-v3") {
      writePriorVersionPackageJson(
        `${p.dir}/package.json`,
        false,
        "@gentrace/openai",
      );
    } else if (p.packageJson.name === "@gentrace/pinecone-v0") {
      writePriorVersionPackageJson(
        `${p.dir}/package.json`,
        false,
        "@gentrace/pinecone",
      );
    } else {
      writePriorVersionPackageJson(`${p.dir}/package.json`, true);
    }
  }
});
