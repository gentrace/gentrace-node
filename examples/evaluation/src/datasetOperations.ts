import { init } from "@gentrace/core";
import {
  getDatasets,
  createDataset,
  getDataset,
  updateDataset,
} from "@gentrace/core";
import { CreateDatasetV2, UpdateDatasetV2 } from "@gentrace/core/models";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function demonstrateDatasetOperations() {
  try {
    // 1. Get datasets with filters
    console.log("Getting filtered datasets...");
    const filteredDatasets = await getDatasets({
      pipelineSlug: "guess-the-year",
      archived: false,
    });
    console.log("Filtered datasets:", filteredDatasets);

    // 2. Create a new dataset
    console.log("Creating a new dataset...");
    const newDatasetPayload: CreateDatasetV2 = {
      name: "Example Dataset",
      description: "This is an example dataset",
      pipelineSlug: "guess-the-year",
    };
    const createdDataset = await createDataset(newDatasetPayload);
    console.log("Created dataset:", createdDataset);

    // 3. Get a single dataset
    console.log("Getting a single dataset...");
    const singleDataset = await getDataset(createdDataset.id);
    console.log("Single dataset:", singleDataset);

    // 4. Update a dataset
    console.log("Updating the dataset...");
    const updatePayload: UpdateDatasetV2 = {
      name: "Updated Example Dataset",
      description: "This dataset has been updated",
      isGolden: true,
    };
    const updatedDataset = await updateDataset(
      createdDataset.id,
      updatePayload,
    );
    console.log("Updated dataset:", updatedDataset);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

demonstrateDatasetOperations();
