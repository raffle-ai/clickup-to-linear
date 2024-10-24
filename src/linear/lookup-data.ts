import { z } from "zod";

import labelData from "~/setup/labels.json";
import statesData from "~/setup/states.json";
import userData from "~/setup/users.json";

const labels = z
  .array(z.object({ name: z.string(), id: z.string() }))
  .parse(labelData);

const states = z
  .array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  )
  .parse(statesData);

const users = z
  .array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
    })
  )
  .parse(userData);

export function getStateByName(name: string) {
  const state = states.find(
    (state) => state.name.toLowerCase() === name.toLowerCase()
  );
  if (!state) {
    throw new Error(`State not found: ${name}`);
  }
  return state;
}

export function getUserByName(name: string) {
  return users.find((user) => user.name === name);
}

export function getLabelByName(name: string) {
  return labels.find((label) => label.name === name);
}
