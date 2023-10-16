import { init, uploadBuffer, uploadFile } from "@gentrace/core";
import fs from "fs/promises";
import { File } from "@web-std/file";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

async function upload() {
  const buffer = await fs.readFile("./icon.png");
  const urlBuffer = await uploadBuffer("icon.png", buffer);

  console.log("buffer url", urlBuffer);

  const urlFile = await uploadFile(
    new File([buffer], "icon.png", {
      type: "image/png",
      lastModified: Date.now(),
    }),
  );

  console.log("file url", urlFile);
}

upload();
