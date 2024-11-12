import { linearClient } from "./linear-client";

export async function viewCycles() {
  const cycles = await linearClient.cycles({
    filter: {
      team: { id: { eq: process.env.TEAM_ID } },
    }
  });

  const output = cycles.nodes;

  process.stdout.write(JSON.stringify(output, null, 2));
}

export async function archiveCycle(cycleId: string) {
  await linearClient.archiveCycle(cycleId);
}
