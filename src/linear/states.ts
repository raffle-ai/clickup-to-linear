import { linearClient } from "./linear-client";

export async function viewStates(teamId: string) {
  // don't use `linearClient.workflowStates();` that returns states for all teams

  const team = await linearClient.team(teamId);
  const states = await team.states();

  console.log(states.nodes.map((state) => [state.id, state.name]));
}
