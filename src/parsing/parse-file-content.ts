import { parse } from "csv-parse/sync";
import { orderBy } from "es-toolkit";
import * as chrono from "chrono-node";

import { commentListSchema, rowSchema } from "./clickup-schemas";

export type ClickUpTask = Awaited<ReturnType<typeof parseRowContent>>;

export type ParsingOptions = {
  limit: number;
  id?: string; // limit export to a given task id
  list?: string; // limit export to a given list (sprint number or backlog)
};

export async function parseFileContent(
  content: string,
  options: ParsingOptions
) {
  const { limit } = options;
  const rows = await parse(content, { bom: true, columns: true });

  if (limit == 1) console.log(rows[0]);

  const tasks = (rows as unknown[]).map(parseRowContent);

  const filteredTasks = tasks.filter(filterTask(options));

  const tasksToProcess = limit ? filteredTasks.slice(0, limit) : filteredTasks;

  if (limit == 1) console.log(tasksToProcess[0]);

  const sortedTasks = orderBy(
    tasksToProcess,
    [(task) => task.createdAt],
    ["desc"]
  );
  return sortedTasks;
}

const filterTask =
  (options: Omit<ParsingOptions, "limit">) => (task: ClickUpTask) => {
    const { id, list } = options;
    if (list) {
      return (
        task.sprintNumber?.toString() === list ||
        task.sprintName.toLowerCase() === list
      );
    }
    if (id) {
      return task.originalId === id;
    }
    return true;
  };

function parseRowContent(row: unknown) {
  // console.log(`> Parsing ${(row as any)["Task Custom ID"]}`);

  const data = rowSchema.parse(row);

  const formattedData = {
    originalId: data["Task Custom ID"],
    createdAt: parseDate(data["Date Created"]),
    createdBy: data["Created By"],
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
    sprintName: data["List"],
    sprintNumber: parseNumber(data["List"].split(" ")[1]),
    isArchived: data["is_archived"] === "True",
  };

  return formattedData;
}

function parseNumber(input?: string) {
  return input ? parseInt(input) : undefined;
}

/** Estimate in hours */
function parseEstimate(ms?: number) {
  return ms ? Math.round(ms / 3600 / 1000) : undefined;
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
