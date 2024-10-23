import { /*LinearFetch,*/ User } from "@linear/sdk";

import { linearClient } from "./linear-client";

export async function getCurrentUser() {
  const me: User = await linearClient.viewer;
  console.log(me);
}

export async function viewUsers() {
  const users = await linearClient.users();
  const output = users.nodes.map((user) => ({
    name: user.name,
    id: user.id,
    email: user.email,
  }));

  process.stdout.write(JSON.stringify(output, null, 2));
}
