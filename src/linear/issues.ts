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
  // const result = await linearClient.archiveIssue(issueId);
  // console.log("Issue archived!", issueId, result);

  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await linearClient.archiveIssue(issueId);
      return; // success
    } catch (err: any) {
      const isDeadlock =
        err?.response?.errors?.some(
          (e: any) => e.message === "deadlock detected"
        ) ?? false;

      if (!isDeadlock || attempt === 10) throw err;

      const wait = 500 * attempt; // back-off (0.5 s, 1 s, 1.5 s…)
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
