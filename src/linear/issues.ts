import { linearClient } from "./linear-client";

export async function updateIssue(issueId = "CAL-2") {
  await linearClient.updateIssue(issueId, {
    teamId: process.env.TEAM_ID,
    title: "Dummy issue from Michael",
    description: "This is a dummy issue created by Michael",
    assigneeId: "2f7f1c50-187a-4b01-a7c0-743e2a09ef7b",
    dueDate: new Date("2024-10-01T12:23:54.721Z"),
    estimate: 10,
    priority: 1,
    subscriberIds: ["918fec15-aa1d-4cc6-8236-20935ce76b2b"],
    projectId: process.env.PROJECT_ID,
    labelIds: ["086687ce-b1a3-47fa-a9c2-c0d5a7e63cb2"],
    stateId: "138b421f-ea76-4a9f-99ab-7f60d6a5584e",
    // createdAt: new Date("2024-09-01T12:23:54.721Z"),
  });

  console.log("Issue updated!");

  // await linearClient.createComment({
  //   issueId,
  //   body: "This is a comment from *Michael*",
  //   createdAt: new Date("2024-09-10T12:23:54.721Z"),
  // });
}

export async function searchIssues(query: string) {
  const results = await linearClient.searchIssues(query);
  const foundIssues = results.nodes.map((issue) => issue.title);
  console.log("Found issues:", foundIssues);
}

export async function getIssueById(issueId: string) {
  const issue = await linearClient.issue(issueId);
  console.log("Issue:", issue);
}
