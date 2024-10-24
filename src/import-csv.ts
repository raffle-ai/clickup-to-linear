import path from "node:path";
import {
  parseFileContent,
  type ClickUpTask,
} from "./parsing/parse-file-content";
import { linearClient } from "./linear/linear-client";
import type { IssueCreateInput } from "@linear/sdk/dist/_generated_documents";
import {
  getLabelByName,
  getStateByName,
  getUserByName,
} from "./linear/lookup-data";

type ImportOptions = {
  dryRun: boolean;
  limit: number;
};

export async function importCSV(filename: string, options: ImportOptions) {
  const text = await readInputFile(filename);
  const tasks = await parseFileContent(text, options.limit);
  await processClickUpTasks(tasks, options);
  console.log("Done!");
}

async function readInputFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename!);
  console.log("Reading: ", filePath);
  const file = Bun.file(filePath);
  return await file.text();
}

function convertClickUpTaskToLinearIssue(task: ClickUpTask): IssueCreateInput {
  const TEAM_ID = process.env.TEAM_ID;
  const PROJECT_ID = process.env.PROJECT_ID;

  if (!TEAM_ID) throw new Error("TEAM_ID is not set");
  if (!PROJECT_ID) throw new Error("PROJECT_ID is not set");

  const assignee = getUserByName(task.assignees[0]);

  return {
    teamId: TEAM_ID,
    projectId: PROJECT_ID,
    title: `${task.originalId} ${task.title}`,
    description: task.content,
    ...(assignee && { assigneeId: assignee.id }),
    stateId: getStatus(task.status)!.id,
    dueDate: task.dueDate,
    estimate: task.estimate,
    // priority: 1,
    subscriberIds: task.reviewers
      .map(getUserByName)
      .map((user) => user?.id)
      .filter(Boolean) as string[],
    labelIds: task.labels
      .map((label) => getLabelByName(label)?.id)
      .filter(Boolean) as string[],
    createdAt: task.createdAt,
    // cycleId: "1",
  };
}

async function processClickUpTasks(
  tasks: ClickUpTask[],
  options: ImportOptions
) {
  const { dryRun } = options;
  let i = 0;

  for (const task of tasks) {
    i++;
    console.log(`Processing ${i}/${tasks.length}`, task.originalId, task.title);
    await createIssueWithComments(task, dryRun);
  }
}

async function createIssueWithComments(task: ClickUpTask, dryRun: boolean) {
  const issue = convertClickUpTaskToLinearIssue(task);
  if (dryRun) {
    // console.log(issue);
    return;
  }
  const result = await linearClient.createIssue(issue);

  const issueId = (await result.issue)?.id;

  for (const comment of task.comments) {
    await linearClient.createComment({
      issueId,
      body: `Comment from ${comment.email || "N/A"}` + comment.text,
      createdAt: comment.createdAt,
    });
  }
}

function getStatus(input: ClickUpTask["status"]) {
  switch (input) {
    case "done":
      return getStateByName("Done");
    case "to do":
      return getStateByName("ToDo");
    case "parked":
      return getStateByName("Backlog");
    case "in review":
      return getStateByName("In Review");
    case "rejected":
      return getStateByName("Canceled");
    case "in progress":
      return getStateByName("In Progress");
    default:
      throw new Error(`Unknown status: ${input}`);
  }
}
