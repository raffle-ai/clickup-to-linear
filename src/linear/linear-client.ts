import { LinearClient } from "@linear/sdk";

const apiKey = process.env.LINEAR_API_KEY;

export const linearClient = new LinearClient({ apiKey });
