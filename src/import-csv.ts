import path from "node:path";
import {
  parseFileContent,
  type ClickUpTask,
  type ParsingOptions,
} from "./parsing/parse-file-content";
import { linearClient } from "./linear/linear-client";
import type { IssueCreateInput } from "@linear/sdk/dist/_generated_documents";
import {
  getCycleByName,
  getLabelByName,
  getStateByName,
  getUserByName,
} from "./linear/lookup-data";
import { countBy } from "es-toolkit";
import { priorities } from "./parsing/clickup-schemas";

const CURRENT_SPRINT_NUMBER = 43;

type ImportOptions = {
  dryRun: boolean;
} & ParsingOptions;

export async function importCSV(filename: string, options: ImportOptions) {
  const text = await readInputFile(filename);
  const tasks = await parseFileContent(text, options);
  showSummary(tasks);
  await processClickUpTasks(tasks, options);

  console.info("Done!", tasks.length, "tasks processed");
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
  const isCurrentSprint = task.sprintNumber === CURRENT_SPRINT_NUMBER;
  const cycleId = isCurrentSprint
    ? getCycleByName(`Sprint ${CURRENT_SPRINT_NUMBER}`)?.id
    : undefined;

  const prefix = isCurrentSprint ? "" : `Sprint ${task.sprintNumber}/`;
  const title = `${prefix}${task.originalId} ${task.title}`;

  const issueToCreate: IssueCreateInput = {
    teamId: TEAM_ID,
    projectId: PROJECT_ID,
    title,
    description: `Created by ${task.createdBy}\n` + task.content,
    ...(assignee && { assigneeId: assignee.id }),
    stateId: getStatus(task.status)!.id,
    dueDate: task.dueDate,
    estimate: task.estimate,
    priority: getPriority(task.priority),
    subscriberIds: task.reviewers
      .map(getUserByName)
      .map((user) => user?.id)
      .filter(Boolean) as string[],
    labelIds: task.labels
      .map((label) => getLabelByName(label)?.id)
      .filter(Boolean) as string[],
    createdAt: task.createdAt,
    cycleId, // we cannot create cycles in the past
  };
  return issueToCreate;
}

async function processClickUpTasks(
  tasks: ClickUpTask[],
  options: ImportOptions
) {
  const { dryRun } = options;
  let i = 0;

  for (const task of tasks) {
    i++;
    if (!dryRun)
      console.log(
        `Processing ${i}/${tasks.length}`,
        task.originalId,
        task.title
      );
    await createIssueWithComments(task, dryRun);
  }
}

async function createIssueWithComments(task: ClickUpTask, dryRun: boolean) {
  const issue = convertClickUpTaskToLinearIssue(task);
  if (dryRun) {
    // console.log(issue, `comments: ${task.comments.length}`);
    return;
  }
  const result = await linearClient.createIssue(issue);

  const issueId = (await result.issue)?.id;
  if (!issueId)
    throw new Error(`No ID returned when creating issue ${task.originalId}`);

  for (const comment of task.comments) {
    await linearClient.createComment({
      issueId,
      body: `Comment by ${comment.email || "N/A"} \n` + comment.text,
      createdAt: comment.createdAt,
    });
  }

  // Comments have to be added before the issue is archived!
  if (task.isArchived || shouldBeArchived(task)) {
    await linearClient.archiveIssue(issueId);
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

/** 1 => Urgent, 2 => High... */
function getPriority(input: ClickUpTask["priority"]) {
  return input !== "" ? priorities.indexOf(input) + 1 : undefined;
}

function shouldBeArchived(task: ClickUpTask) {
  if (task.sprintNumber === CURRENT_SPRINT_NUMBER) return false;
  if (task.status === "done" || task.status === "rejected") return true;
}

/** Show a breakdown of parsed data by status and sprint */
function showSummary(tasks: ClickUpTask[]) {
  console.log(countBy(tasks, (task) => task.status));
  console.log(countBy(tasks, (task) => task.sprintName));
}
