import { linearClient } from "./linear-client";

const PROJECT_ID = "cffc9b96-e589-4fcb-86be-6220085ae01a";

export async function updateIssue(teamId: string, issueId = "CAL-2") {
  await linearClient.updateIssue(issueId, {
    teamId,
    title: "Dummy issue from Michael",
    description: "This is a dummy issue created by Michael",
    assigneeId: "2f7f1c50-187a-4b01-a7c0-743e2a09ef7b",
    dueDate: new Date("2024-10-01T12:23:54.721Z"),
    estimate: 10,
    priority: 1,
    subscriberIds: ["918fec15-aa1d-4cc6-8236-20935ce76b2b"],
    projectId: PROJECT_ID,
    labelIds: ["086687ce-b1a3-47fa-a9c2-c0d5a7e63cb2"],
    stateId: "138b421f-ea76-4a9f-99ab-7f60d6a5584e",
    // createdAt: new Date("2024-09-01T12:23:54.721Z"),
  });

  // await linearClient.createComment({
  //   issueId,
  //   body: "This is a comment from *Michael*",
  //   createdAt: new Date("2024-09-10T12:23:54.721Z"),
  // });
}
