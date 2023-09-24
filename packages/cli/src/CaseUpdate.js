import { updateTestCase } from "@gentrace/core";
import fs from "fs";
import { Box, Text } from "ink";
import ora from "ora";
import React, { useEffect, useState } from "react";
import z from "zod";

const TestCaseUpdateSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  inputs: z.record(z.any()).optional(),
  expectedOutputs: z.record(z.any()).optional(),
});

const TestCasesUpdateSchema = z.array(TestCaseUpdateSchema);

function CaseUpdate({ options }) {
  const { file } = options;

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const spinner = ora("Loading...");
    spinner.start();

    fs.readFile(file, "utf8", (err, data) => {
      if (err) {
        setLoading(false);
        spinner.stop();
        setErrorMessage(err.message);
        return;
      }

      let parsedData = null;

      try {
        parsedData = JSON.parse(data);
      } catch (err) {
        setLoading(false);
        spinner.stop();
        setErrorMessage(err.message);
        return;
      }

      const singleResult = TestCaseUpdateSchema.safeParse(parsedData);

      if (singleResult.success) {
        updateTestCase({
          ...singleResult.data,
        })
          .then((caseId) => {
            setLoading(false);
            spinner.stop();

            setSuccessMessage(`Test case (${caseId}) updated successfully`);
          })
          .catch((err) => {
            setLoading(false);
            spinner.stop();

            setErrorMessage(err.message);
          });
        return;
      }

      const multipleResult = TestCasesUpdateSchema.safeParse(parsedData);

      if (multipleResult.success) {
        const updatePromises = [];
        for (const updatePayload of multipleResult.data) {
          updatePromises.push(updateTestCase({ ...updatePayload }));
        }

        Promise.all(updatePromises)
          .then((caseIds) => {
            setLoading(false);
            spinner.stop();
            setSuccessMessage(
              `${caseIds.length} test cases updated successfully`
            );
          })
          .catch((err) => {
            setLoading(false);
            spinner.stop();
            setErrorMessage(err.message);
          });
        return;
      }
      setLoading(false);
      spinner.stop();
      setErrorMessage("Invalid test case(s) format");
    });
  }, [file]);

  useEffect(() => {
    if (successMessage) {
      process.exit(0);
    }

    if (errorMessage) {
      process.exit(1);
    }
  }, [successMessage, errorMessage]);

  return (
    <>
      {errorMessage && (
        <Box>
          <Text color="red">{errorMessage}</Text>
        </Box>
      )}

      {successMessage && (
        <Box>
          <Text color="green">{successMessage}</Text>
        </Box>
      )}
    </>
  );
}

export default CaseUpdate;
