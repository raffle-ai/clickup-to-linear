import { countBy } from "es-toolkit";
import {
  createClickUpClient,
  type TaskWithComments,
} from "./clickup/clickup-client";
import { linearClient } from "./linear/linear-client";
import type { IssueCreateInput } from "@linear/sdk/dist/_generated_documents";
import {
  getCycleByName,
  getLabelByName,
  getStateByName,
  getUserByEmail,
} from "./linear/lookup-data";
import { format } from "date-fns";

const CURRENT_SPRINT_NUMBER = 43;

type Options = {
  dryRun: boolean;
  limit: number;
  id?: string; // limit export to a given task id
};

export async function migrate(list: string, options: Options) {
  const client = createClickUpClient();

  const tasks = await client.getTasksAndCommentByList(list, options);
  showSummary(tasks);

  await processClickUpTasks(tasks, options);
  console.info(
    `List ${list} DONE! ${tasks.length} tasks processed${
      options.dryRun ? " (dry run)" : ""
    }`
  );
}

async function processClickUpTasks(
  tasks: TaskWithComments[],
  options: Options
) {
  const { dryRun } = options;
  let i = 0;

  for (const task of tasks) {
    i++;
    if (!dryRun) {
      console.log(`Processing ${i}/${tasks.length}`, task.customId, task.title);
    }
    await createIssueWithComments(task, dryRun);
  }
}

async function createIssueWithComments(
  task: TaskWithComments,
  dryRun: boolean
) {
  const issue = convertClickUpTaskToLinearIssue(task);
  if (dryRun) {
    // console.log(issue, `comments: ${task.comments.length}`);
    return;
  }
  const result = await linearClient.createIssue(issue);

  const issueId = (await result.issue)?.id;
  if (!issueId)
    throw new Error(`No ID returned when creating issue ${task.customId}`);

  for (const comment of task.comments) {
    await linearClient.createComment({
      issueId,
      body: `Comment by ${comment.email || "N/A"} \n` + comment.text,
      createdAt: comment.createdAt,
    });
  }

  // Comments have to be added before the issue is archived!
  if (shouldBeArchived(task)) {
    await linearClient.archiveIssue(issueId);
  }
}

function convertClickUpTaskToLinearIssue(
  task: TaskWithComments
): IssueCreateInput {
  const TEAM_ID = process.env.TEAM_ID;
  const PROJECT_ID = process.env.PROJECT_ID;

  if (!TEAM_ID) throw new Error("TEAM_ID is not set");
  if (!PROJECT_ID) throw new Error("PROJECT_ID is not set");

  const assignee = getUserByEmail(task.assignees[0]);
  const isCurrentSprint = task.listName === CURRENT_SPRINT_NUMBER.toString();
  const cycleId = isCurrentSprint
    ? getCycleByName(`Sprint ${CURRENT_SPRINT_NUMBER}`)?.id
    : undefined;

  const prefix = isCurrentSprint ? "" : getSprintName(task.listName) + " ";
  const title = `${prefix}${task.customId} ${task.title}`;

  const issueToCreate: IssueCreateInput = {
    teamId: TEAM_ID,
    projectId: PROJECT_ID,
    title,
    description:
      `Created by ${task.createdBy}: ${task.url}\n` + task.description,
    ...(assignee && { assigneeId: assignee.id }),
    stateId: getStatus(task)!.id,
    dueDate: formatDate(task.dueDate),
    estimate: task.estimate,
    priority: getPriority(task.priority),
    subscriberIds: task.reviewers
      .map(getUserByEmail)
      .map((user) => user?.id)
      .filter(Boolean) as string[],
    labelIds: task.labels
      .map((label) => getLabelByName(label)?.id)
      .filter(Boolean) as string[],
    createdAt: task.createdAt,
    cycleId, // we cannot create cycles in the past
  };
  // console.log("To create", issueToCreate);

  return issueToCreate;
}

function shouldBeArchived(task: TaskWithComments) {
  if (task.listName === CURRENT_SPRINT_NUMBER.toString()) return false;
  if (task.status === "done" || task.status === "rejected") return true;
  if (task.listName === "backlog") return false;
  if (task.isArchived) return true;
  return false;
}

function getSprintName(listName: string) {
  if (listName.toLowerCase().startsWith("backlog")) return "Backlog";
  return `Sprint ${listName}`;
}

function getStatus(task: TaskWithComments) {
  const { listName, status } = task;
  if (listName === "backlog") return getStateByName("Backlog");

  switch (status) {
    case "done":
      return getStateByName("Done");
    case "to do":
      return getStateByName("ToDo");
    case "parked":
      return getStateByName("Parked");
    case "in review":
      return getStateByName("In Review");
    case "rejected":
      return getStateByName("Canceled");
    case "in progress":
      return getStateByName("In Progress");
    default:
      throw new Error(`Unknown status: ${status}`);
  }
}

function getPriority(input: TaskWithComments["priority"]) {
  return typeof input === "number" ? input + 1 : undefined; // "Urgent" is 1 in Linear, 0 in ClickUp
}

function formatDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function showSummary(tasks: TaskWithComments[]) {
  // console.log(tasks[0]);

  const statuses = countBy(tasks, (task) => task.status);
  const priorities = countBy(
    tasks,
    (task) => "Priority " + (task.priority ?? "not set")
  );
  const estimates = countBy(tasks, (task) => task.estimate ?? "not set");
  const labels = countBy(tasks, (task) => task.labels[0] || "not set");
  const commentsCounts = countBy(
    tasks,
    (task) => `${task.comments.length} comments`
  );
  const reviewers = countBy(tasks, (task) => task.reviewers[0] || "not set");
  console.log(
    statuses,
    priorities,
    estimates,
    labels,
    commentsCounts,
    reviewers
  );
}
