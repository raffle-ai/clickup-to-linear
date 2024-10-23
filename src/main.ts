import { updateIssue } from "./linear/issues";
import { createLabels, viewLabels } from "./linear/labels";
import { viewProjects } from "./linear/projects";
import { viewStates } from "./linear/states";
import { getCurrentUser, viewUsers } from "./linear/users";

const teamId = process.env.TEAM_ID;

async function main() {
  if (!teamId) throw new Error("TEAM_ID is not set");

  const action = process.argv[2];
  switch (action) {
    case "me":
      return await getCurrentUser();
    case "users":
      return await viewUsers();
    case "issues/update":
      return await updateIssue(teamId, "CAL-2");
    case "labels/add":
      return await createLabels();
    case "labels/view":
      return await viewLabels();
    case "projects":
      return await viewProjects();
    case "states":
      return await viewStates(teamId);
    default:
      console.log("Unknown action!");
  }
}

main();
