import path from "node:path";
import { parse } from "csv-parse/sync";
import { uniq } from "es-toolkit";
import * as chrono from "chrono-node";

import { commentSchema, rowSchema } from "./src/clickup-schemas";

const argv = Bun.argv;
const filename = argv.at(-1);
if (!filename) throw new Error("No filename provided");

const text = await readInputFile(filename);
const issues = await parseFileContent(text, 10000);

async function readInputFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename!);
  console.log("Reading: ", filePath);
  const file = Bun.file(filePath);
  return await file.text();
}

async function parseFileContent(content: string, limit = 2000) {
  const records = await parse(content, { bom: true, columns: true });

  const rows = records.slice(1, limit) as unknown[]; // skip the header

  console.log(records.length, records.at(-1));

  const parsedRecords = rows.map(parseRowContent);
  console.log(uniq(parsedRecords.map((record) => record.status)));
  console.log("Done!", parsedRecords.length, "rows");
  console.log(parsedRecords.at(-1));
  return parsedRecords;
}

function parseRowContent(row: unknown) {
  console.log(`> Parsing ${(row as any)["Task Custom ID"]}`);

  const data = rowSchema.parse(row);

  const formattedData = {
    originalId: data["Task Custom ID"],
    createdAt: parseDate(data["Date Created"]),
    dueDate: parseDate(data["Due Date"]),
    assigneeNames: parseArrayContent(data["Assignees"]),
    comments: parseComments(data["Comments"]),
    status: data["Status"],
    title: data["Task Name"],
    content: data["Task Content"],
    priority: data["MoSCoW (drop down)"],
    estimate: parseEstimate(parseNumber(data["Time Estimated"])),
  };

  return formattedData;
}

function parseNumber(input?: string) {
  return input ? parseInt(input) : undefined;
}

/** Estimate in hours */
function parseEstimate(ms?: number) {
  return ms ? ms / 3600 / 1000 : undefined;
}

function parseDate(input: string) {
  // return input ? new Date(parseInt(input)) : undefined;
  return input ? chrono.parseDate(input) : undefined;
}

function parseArrayContent(input: string) {
  return input
    .slice(1, -1)
    .split(",")
    .map((item: string) => item.trim());
}

function parseComments(input: string) {
  if (!input) return [];
  const items = JSON.parse(input);
  return items.map((rawItem: unknown) => {
    const item = commentSchema.parse(rawItem);
    return {
      text: item.text,
      createdAt: new Date(item.date),
      email: item.by,
    };
  });
}
