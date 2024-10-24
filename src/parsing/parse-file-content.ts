import { parse } from "csv-parse/sync";
import { orderBy } from "es-toolkit";
import * as chrono from "chrono-node";

import { commentListSchema, rowSchema } from "./clickup-schemas";

export type ClickUpTask = Awaited<ReturnType<typeof parseRowContent>>;

export async function parseFileContent(content: string, limit: number) {
  const records = await parse(content, { bom: true, columns: true });

  const rows = limit ? records.slice(1).slice(0, limit) : records.slice(1); // skip the header

  const tasks = (rows as unknown[]).map(parseRowContent);

  if (limit == 1) console.log(rows[0]);

  const sortedTasks = orderBy(tasks, [(r) => r.createdAt], ["desc"]);
  return sortedTasks;
}

function parseRowContent(row: unknown) {
  console.log(`> Parsing ${(row as any)["Task Custom ID"]}`);

  const data = rowSchema.parse(row);

  const formattedData = {
    originalId: data["Task Custom ID"],
    createdAt: parseDate(data["Date Created"]),
    dueDate: parseDate(data["Due Date"]),
    assignees: parseArrayContent(data["Assignees"]),
    reviewers: parseArrayContent(data["Reviewer (users)"]),
    comments: parseComments(data["Comments"]),
    status: data["Status"],
    title: data["Task Name"],
    content: data["Task Content"],
    priority: data["MoSCoW (drop down)"],
    estimate: parseEstimate(parseNumber(data["Time Estimated"])),
    labels: data["Area of Work (labels)"],
    sprint: data["List"],
    isArchived: data["is_archived"] === "True",
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
  const parsedItems = commentListSchema.parse(items);

  const comments = parsedItems.map((item) => {
    return {
      text: item.text,
      createdAt: new Date(item.date),
      email: item.by,
    };
  });
  return comments;
}
