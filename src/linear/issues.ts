import { linearClient } from "./linear-client";

export async function updateIssue(issueId: string) {
  const result = await linearClient.updateIssue(issueId, {
    // TODO
  });
  console.log("Issue updated!", result);
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

export async function archiveIssue(issueId: string) {
  const result = await linearClient.archiveIssue(issueId);
  console.log("Issue archived!", issueId, result);
}
