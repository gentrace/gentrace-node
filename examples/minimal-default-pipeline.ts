import { init, interaction } from '../src/lib';

// Initialize Gentrace - this will automatically set up OpenTelemetry
init({
  apiKey: process.env['GENTRACE_API_KEY']!,
  baseURL: process.env['GENTRACE_BASE_URL'],
});

// Simple AI function
async function askAI(question: string): Promise<string> {
  console.log(`Processing question: ${question}`);
  // Simulate AI processing
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `This is a simulated response to: "${question}"`;
}

// Create instrumented version WITHOUT specifying pipeline ID
const trackedAskAI = interaction('Ask AI Question', askAI);

async function main() {
  console.log('\n🚀 Running minimal example with default pipeline...\n');

  try {
    const response = await trackedAskAI('What is the meaning of life?');
    console.log('Response:', response);

    // Give time for spans to be exported
    console.log('\n⏳ Waiting for spans to be exported...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('\n✅ Done! Check your Postgres GTSpan table.');
    console.log('Expected: 1 span with pipelineId = "default"');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
