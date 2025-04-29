import { interaction } from '../../src/lib/interaction';

const PIPELINE_ID = 'simple-pipeline';

function simpleInteractionLogic({ testing, monkies }: { testing: string; monkies: number }) {
  let finalResult: string = 'action completed successfully';
  return finalResult;
}

const simpleInteraction = interaction(PIPELINE_ID, simpleInteractionLogic);

async function main() {
  await simpleInteraction({ testing: 'hello', monkies: 5 });
}

main();
