import { cli, command } from "cleye";

import { migrate } from "./migrate";

/** Entry point for CSV import CLI script */
const argv = cli({
  name: "cli-import.ts",
  description:
    "CLI app to migrate existing tasks from ClickUp to Linear.app, takes a the list number or `backlog` as a parameter",
  parameters: ["<list>"],
  flags: {
    dryRun: {
      type: Boolean,
      description: "Only Read CSV file without writing any data",
      default: false,
    },
    limit: {
      type: Number,
      description: "Max number of rows to process",
      default: 0,
    },
    page: {
      type: Number,
      description: "page number (starts at 0)",
      default: 0,
    },
    id: {
      type: String,
      description: "The ID of a single task to process, starting with POC-**",
    },
  },
});

migrate(argv._.list, argv.flags);
