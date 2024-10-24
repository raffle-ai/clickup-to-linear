import { cli, command } from "cleye";

import { importCSV } from "./import-csv";

/** Entry point for CSV import CLI script */
const argv = cli({
  name: "cli-import.ts",
  description:
    "CLI app to read a CSV file generated from ClickUp migrate issues to Linear.app",
  parameters: ["<fileName>"],
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
  },
});

importCSV(argv._.fileName, argv.flags);
