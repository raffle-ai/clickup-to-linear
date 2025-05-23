import { cli, command } from "cleye";

import {
  archiveIssue,
  getIssueById,
  searchIssues,
  updateIssue,
} from "./linear/issues";
import { createTeamLabels, viewLabels } from "./linear/labels";
import { viewProjects } from "./linear/projects";
import { viewStates } from "./linear/states";
import { getCurrentUser, viewTeams, viewUsers } from "./linear/users";
import { archiveCycle, viewCycles } from "./linear/cycles";
import { checkRateLimits } from "./linear/rate-limit";

cli({
  name: "setup.ts",
  description:
    "CLI app to read data from Linear API and setup JSON files used later when migrating from ClickUp",
  commands: [
    command(
      {
        name: "me",
        help: { description: "Get current user" },
      },
      getCurrentUser
    ),
    command(
      {
        name: "teams",
        help: { description: "View teams" },
      },
      viewTeams
    ),
    command(
      {
        name: "cycles",
        help: { description: "Output the list of cycles (sprints)" },
      },
      viewCycles
    ),
    command(
      {
        name: "archive-cycle",
        help: { description: "Archive cycle by ID" },
        parameters: ["<cycleId>"],
      },
      (argv) => archiveCycle(argv._.cycleId)
    ),
    command(
      {
        name: "users",
        help: { description: "Output the list of users" },
      },
      viewUsers
    ),
    command(
      {
        name: "update-issue",
        help: { description: "Update an issue" },
        parameters: ["<issueId>"],
      },
      async (argv) => {
        await updateIssue(argv._.issueId);
      }
    ),
    command(
      {
        name: "find-issue",
        help: { description: "Find an issue" },
        parameters: ["<query>"],
      },
      async (argv) => {
        await searchIssues(argv._.query);
      }
    ),
    command(
      {
        name: "get-issue",
        help: { description: "Get an issue by ID" },
        parameters: ["<id>"],
      },
      async (argv) => {
        await getIssueById(argv._.id);
      }
    ),
    command(
      {
        name: "archive-issue",
        help: {
          description:
            "Archive an issue by ID (to recover from API random errors)",
        },
        parameters: ["<id>"],
      },
      async (argv) => {
        await archiveIssue(argv._.id);
      }
    ),
    command(
      {
        name: "labels",
        help: { description: "View labels" },
      },
      viewLabels
    ),
    command(
      {
        name: "create-labels",
        help: {
          description:
            "Create labels from a JSON file made of [{item, color, name}]",
        },
        parameters: ["<filepath>"],
      },
      (argv) => createTeamLabels(argv._.filepath)
    ),
    command(
      {
        name: "projects",
        help: { description: "View projects" },
      },
      viewProjects
    ),
    command(
      {
        name: "states",
        help: { description: "View states" },
      },
      viewStates
    ),
    command(
      {
        name: "rate-limit",
        help: { description: "View rate limiting data" },
      },
      checkRateLimits
    ),
  ],
});
