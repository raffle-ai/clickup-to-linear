import { linearClient } from "./linear-client";

export async function viewCycles() {
  const cycles = await linearClient.cycles();

  const output = cycles.nodes;

  process.stdout.write(JSON.stringify(output, null, 2));
}
