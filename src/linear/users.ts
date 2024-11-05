import { /*LinearFetch,*/ User } from "@linear/sdk";

import { linearClient } from "./linear-client";

export async function viewTeams() {
  const teams = await linearClient.teams();

  console.log(
    teams.nodes.map((team) => ({
      name: team.name,
      id: team.id,
    }))
  );
}

export async function getCurrentUser() {
  const me: User = await linearClient.viewer;
  console.log(me);
}

/** To be run from the setup CLI to generate `/setup/users.json` data */
export async function viewUsers() {
  const users = await linearClient.users();
  const output = users.nodes.map((user) => ({
    name: user.name,
    id: user.id,
    email: user.email,
  }));

  process.stdout.write(JSON.stringify(output, null, 2));
}
