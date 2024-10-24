import { linearClient } from "./linear-client";

/**
 * To be run from setup CLI to generate `/setup/states.json` data
 * We don't use `linearClient.workflowStates();` that returns states for all teams
 * */
export async function viewStates() {
  const TEAM_ID = process.env.TEAM_ID;
  if (!TEAM_ID) throw new Error("TEAM_ID is not set");

  const team = await linearClient.team(TEAM_ID);
  const states = await team.states();

  const output = states.nodes.map((state) => ({
    name: state.name,
    id: state.id,
  }));

  process.stdout.write(JSON.stringify(output, null, 2));
}
