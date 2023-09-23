const fs = require("fs");
const useState = require("react").useState;
const { createTestCase, createTestCases } = require("@gentrace/core");
const { Box, Text } = require("ink");
const useEffect = require("react").useEffect;
const { config } = require("./utils.js");
const z = require("zod");
const ora = require("ora");

const TestCaseSchema = z.object({
  name: z.string(),
  inputs: z.record(z.any()),
  expectedOutputs: z.record(z.any()).optional(),
});

const TestCasesSchema = z.array(TestCaseSchema);

function CaseCreate({ options }) {
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

      const singleResult = TestCaseSchema.safeParse(parsedData);

      if (singleResult.success) {
        createTestCase({
          pipelineSlug: config.activePipelineSlug,
          ...singleResult.data,
        })
          .then((caseId) => {
            setLoading(false);
            spinner.stop();

            setSuccessMessage(`Test case (${caseId}) created successfully`);
          })
          .catch((err) => {
            setLoading(false);
            spinner.stop();

            setErrorMessage(err.message);
          });
        return;
      }

      const multipleResult = TestCasesSchema.safeParse(parsedData);

      if (multipleResult.success) {
        createTestCases({
          pipelineSlug: config.activePipelineSlug,
          testCases: multipleResult.data,
        })
          .then((creationCount) => {
            setLoading(false);
            spinner.stop();
            setSuccessMessage(
              `${creationCount} test cases created successfully`
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

module.exports = CaseCreate;
module.exports.default = CaseCreate;
